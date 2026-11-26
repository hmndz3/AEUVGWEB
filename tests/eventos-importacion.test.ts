import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  COLUMNAS_IMPORTACION_EVENTOS,
  interpretarTipoActividad,
} from "../src/lib/eventos/columnas-importacion";
import { leerFilasDeEventos } from "../src/lib/eventos/importacion-eventos";
import {
  generarPlantillaEventos,
  HOJA_EVENTOS,
  NOMBRE_PLANTILLA_EVENTOS,
} from "../src/lib/eventos/plantilla-eventos";
import type {
  DatosEventoPersistidos,
  OrganizadorNuevo,
} from "../src/lib/eventos/repositorio-eventos";
import type { RepositorioImportacionEventos } from "../src/lib/eventos/repositorio-importacion-eventos";
import { ServicioImportacionEventos } from "../src/lib/eventos/servicio-importacion-eventos";
import {
  claveDeEvento,
  validarFilasDeEventos,
  type CatalogosEventos,
} from "../src/lib/eventos/validacion-importacion-eventos";
import type { GuardadoDeImagenes, ResultadoImagen } from "../src/lib/importacion/guardado-imagenes";

const AHORA = new Date("2026-11-26T12:00:00.000Z");

const LISTAS = {
  categorias: ["Festival", "Conferencia o taller"],
  organizadores: ["AEBIO", "Club de Ajedrez"],
};

function catalogos(): CatalogosEventos {
  return {
    categorias: new Map([
      ["festival", 3],
      ["conferencia o taller", 7],
    ]),
    nombresCategorias: ["Festival", "Conferencia o taller"],
    asociaciones: new Map([
      ["aebio", 2],
      ["asociacion de biologia", 2],
    ]),
    clubes: new Map([["club de ajedrez", 5]]),
  };
}

/** Fila con todo correcto; cada prueba cambia lo que necesita. */
function fila(cambios: Partial<Parameters<typeof validarFilasDeEventos>[0][number]> = {}) {
  return {
    fila: 2,
    nombre: "Feria de Emprendimiento",
    descripcion: "Exposición de proyectos de estudiantes con jurado y premiación al final.",
    categoria: "Festival",
    tipoActividad: "Académica",
    fechaInicio: "2026-12-04",
    horaInicio: "09:00",
    fechaFin: "",
    horaFin: "16:00",
    ubicacion: "Plaza central del campus",
    organizador: "AEBIO",
    cupo: "",
    informacionAdicional: "",
    enlaceImagen: "",
    ...cambios,
  };
}

function validar(filas: ReturnType<typeof fila>[], existentes: string[] = []) {
  return validarFilasDeEventos(filas, catalogos(), { ahora: AHORA, existentes });
}

/** Archivo de Excel armado en memoria, como el que sube el administrador. */
async function archivoCon(filas: (string | number)[][]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Eventos");
  hoja.addRow([...COLUMNAS_IMPORTACION_EVENTOS]);
  filas.forEach((valores) => hoja.addRow(valores));

  return Buffer.from(await libro.xlsx.writeBuffer());
}

class RepositorioFalso implements RepositorioImportacionEventos {
  readonly creados: { datos: DatosEventoPersistidos; organizadores: OrganizadorNuevo[] }[] = [];

  constructor(private readonly existentes: string[] = []) {}

  async catalogos(): Promise<CatalogosEventos> {
    return catalogos();
  }

  async listas() {
    return LISTAS;
  }

  async clavesExistentes(): Promise<string[]> {
    return this.existentes;
  }

  async crear(datos: DatosEventoPersistidos, organizadores: OrganizadorNuevo[]): Promise<number> {
    this.creados.push({ datos, organizadores });
    return this.creados.length;
  }
}

class ImagenesFalsas implements GuardadoDeImagenes {
  readonly pedidos: string[] = [];

  constructor(private readonly resultado: ResultadoImagen) {}

  async guardar(enlace: string): Promise<ResultadoImagen> {
    this.pedidos.push(enlace);
    return this.resultado;
  }
}

test("la plantilla de eventos es un Excel con los encabezados que espera el importador", async () => {
  const plantilla = await generarPlantillaEventos(LISTAS);

  assert.equal(plantilla.subarray(0, 2).toString("latin1"), "PK");
  assert.equal(NOMBRE_PLANTILLA_EVENTOS, "plantilla-eventos.xlsx");

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(plantilla as unknown as ArrayBuffer);
  const hoja = libro.worksheets[0];

  const columnas: string[] = [];
  hoja.getRow(1).eachCell((celda) => columnas.push(String(celda.value ?? "").trim()));

  assert.equal(hoja.name, HOJA_EVENTOS);
  assert.deepEqual(columnas, [...COLUMNAS_IMPORTACION_EVENTOS]);
  assert.deepEqual(
    libro.worksheets.map((pagina) => pagina.name),
    [HOJA_EVENTOS, "Listas", "Instrucciones"]
  );
});

test("la fila de ejemplo de la plantilla se lee y pasa la validación", async () => {
  const lectura = await leerFilasDeEventos(await generarPlantillaEventos(LISTAS));

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;
  assert.equal(lectura.filas.length, 1);

  const { validas, errores } = validarFilasDeEventos(lectura.filas, catalogos(), {
    ahora: new Date("2026-11-01T00:00:00.000Z"),
  });

  assert.deepEqual(errores, []);
  assert.equal(validas.length, 1);
  assert.equal(validas[0].datos.nombre, "Feria de Emprendimiento UVG");
});

test("las columnas se localizan por su nombre, en cualquier orden y con alias", async () => {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Mis eventos");
  hoja.addRow(["LUGAR", "NOMBRE", "fecha", "hora", "hora fin", "descripcion", "categoria"]);
  hoja.addRow([
    "Auditorio",
    "Noche de talentos",
    "2026-12-10",
    "18:00",
    "21:00",
    "Presentaciones de música y danza de los clubes del campus.",
    "Festival",
  ]);

  const lectura = await leerFilasDeEventos(Buffer.from(await libro.xlsx.writeBuffer()));

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;
  assert.equal(lectura.filas[0].nombre, "Noche de talentos");
  assert.equal(lectura.filas[0].ubicacion, "Auditorio");
  assert.equal(lectura.filas[0].fechaInicio, "2026-12-10");
  assert.equal(lectura.filas[0].horaFin, "21:00");
});

test("un archivo sin las columnas obligatorias se reporta antes de leer filas", async () => {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Eventos");
  hoja.addRow(["Nombre del evento", "Ubicación"]);
  hoja.addRow(["Algo", "Campus"]);

  const lectura = await leerFilasDeEventos(Buffer.from(await libro.xlsx.writeBuffer()));

  assert.equal(lectura.tipo, "sin_columnas");
  if (lectura.tipo !== "sin_columnas") return;
  assert.ok(lectura.faltantes.includes("Descripción"));
  assert.ok(lectura.faltantes.includes("Fecha de inicio"));
});

test("un archivo que no es Excel se reporta como ilegible", async () => {
  const lectura = await leerFilasDeEventos(Buffer.from("no soy un libro de Excel"));

  assert.equal(lectura.tipo, "ilegible");
});

test("un evento cuya fecha ya pasó no se crea", () => {
  const { validas, errores } = validar([fila({ fechaInicio: "2026-10-01", horaFin: "16:00" })]);

  assert.equal(validas.length, 0);
  assert.equal(errores.length, 1);
  assert.equal(errores[0].campo, "Finalización");
  assert.match(errores[0].mensaje, /ya terminó/);
});

test("un evento que todavía no termina sí se crea aunque haya empezado", () => {
  const enCurso = fila({ fechaInicio: "2026-11-25", horaInicio: "08:00", fechaFin: "2026-11-27" });

  assert.equal(validar([enCurso]).validas.length, 1);
});

test("un evento que ya existe en la plataforma no se vuelve a crear", () => {
  const existente = claveDeEvento("Feria de Emprendimiento", new Date("2026-12-04T15:00:00.000Z"));
  const { validas, repetidas } = validar([fila()], [existente]);

  assert.equal(validas.length, 0);
  assert.equal(repetidas.length, 1);
  assert.match(repetidas[0].mensaje, /Ya existe un evento/);
});

test("dos filas iguales del mismo archivo crean un solo evento", () => {
  const { validas, repetidas } = validar([fila(), fila({ fila: 3 })]);

  assert.equal(validas.length, 1);
  assert.equal(repetidas.length, 1);
  assert.equal(repetidas[0].fila, 3);
});

test("el mismo nombre en otra fecha sí se crea", () => {
  const { validas, repetidas } = validar([fila(), fila({ fila: 3, fechaInicio: "2026-12-11" })]);

  assert.equal(validas.length, 2);
  assert.deepEqual(repetidas, []);
});

test("una categoría que no existe se reporta con las disponibles", () => {
  const { errores } = validar([fila({ categoria: "Fiesta" })]);

  assert.equal(errores[0].campo, "Categoría");
  assert.match(errores[0].mensaje, /«Fiesta» no existe/);
  // Las categorías se nombran tal como se escriben, no como se comparan.
  assert.match(errores[0].mensaje, /Festival, Conferencia o taller/);
});

test("el organizador se reconoce por siglas, por nombre de club o se guarda como unidad", () => {
  const porSiglas = validar([fila({ organizador: "AEBIO" })]).validas[0].datos;
  const porClub = validar([fila({ organizador: "Club de Ajedrez" })]).validas[0].datos;
  const libre = validar([fila({ organizador: "Facultad de Ciencias" })]).validas[0].datos;

  assert.equal(porSiglas.idAsociacion, 2);
  assert.equal(porClub.idClub, 5);
  assert.equal(libre.idAsociacion, null);
  assert.equal(libre.unidadUvg, "Facultad de Ciencias");
});

test("la hora se interpreta en la zona de Guatemala", () => {
  const { validas } = validar([fila()]);

  // 09:00 en Guatemala son las 15:00 UTC.
  assert.equal(validas[0].datos.fechaInicio.toISOString(), "2026-12-04T15:00:00.000Z");
  // Sin fecha de fin se toma el mismo día que empieza.
  assert.equal(validas[0].datos.fechaFin.toISOString(), "2026-12-04T22:00:00.000Z");
});

test("una fecha o una hora mal escritas se reportan con un ejemplo", () => {
  const sinFecha = validar([fila({ fechaInicio: "4 de diciembre" })]).errores[0];
  const sinHora = validar([fila({ horaInicio: "en la mañana" })]).errores[0];

  assert.match(sinFecha.mensaje, /2026-10-09/);
  assert.match(sinHora.mensaje, /14:00/);
});

test("el tipo de actividad acepta variantes y cae en Otro cuando está vacío", () => {
  assert.equal(interpretarTipoActividad("Académica"), "ACADEMICA");
  assert.equal(interpretarTipoActividad("VOLUNTARIADO"), "VOLUNTARIADO");
  assert.equal(interpretarTipoActividad(""), "OTRO");
  assert.equal(interpretarTipoActividad("deportiva"), null);
});

test("la revisión no guarda nada y cuenta lo que pasaría", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioImportacionEventos(
    repositorio,
    new ImagenesFalsas({ tipo: "guardada", url: "/api/imagenes/x.jpg" })
  );

  const archivo = await archivoCon([
    [
      "Noche de talentos",
      "Presentaciones de música y danza de los clubes del campus.",
      "Festival",
      "Recreativa",
      "2026-12-10",
      "18:00",
      "",
      "21:00",
      "Auditorio",
      "AEBIO",
      "",
      "",
      "",
    ],
    [
      "Evento viejo",
      "Actividad que ya ocurrió y no debería volver a publicarse en la cartelera.",
      "Festival",
      "Otro",
      "2026-01-10",
      "18:00",
      "",
      "21:00",
      "Auditorio",
      "",
      "",
      "",
      "",
    ],
  ]);

  const resultado = await servicio.revisar(archivo, AHORA);

  assert.equal(resultado.tipo, "revisado");
  if (resultado.tipo !== "revisado") return;
  assert.equal(resultado.total, 2);
  assert.equal(resultado.correctas, 1);
  assert.equal(resultado.fallidas, 1);
  assert.deepEqual(repositorio.creados, []);
});

test("la importación guarda solo las filas nuevas y en borrador", async () => {
  const repositorio = new RepositorioFalso();
  const imagenes = new ImagenesFalsas({ tipo: "guardada", url: "/api/imagenes/afiche.jpg" });
  const servicio = new ServicioImportacionEventos(repositorio, imagenes);

  const archivo = await archivoCon([
    [
      "Noche de talentos",
      "Presentaciones de música y danza de los clubes del campus.",
      "Festival",
      "Recreativa",
      "2026-12-10",
      "18:00",
      "",
      "21:00",
      "Auditorio",
      "Club de Ajedrez",
      50,
      "Entrada libre",
      "https://drive.google.com/file/d/ABCDEFGHIJ/view",
    ],
  ]);

  const resultado = await servicio.importar(archivo, 9, AHORA);

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;
  assert.equal(resultado.guardadas, 1);
  assert.equal(repositorio.creados.length, 1);

  const creado = repositorio.creados[0];
  assert.equal(creado.datos.nombre, "Noche de talentos");
  assert.equal(creado.datos.imagenUrl, "/api/imagenes/afiche.jpg");
  assert.equal(creado.datos.cupo, 50);
  assert.deepEqual(creado.organizadores, [
    { idAsociacion: null, idClub: 5, unidadUvg: null, organizadorPrincipal: true },
  ]);
  assert.match(creado.datos.textoBusqueda, /noche de talentos/);
  assert.deepEqual(imagenes.pedidos, ["https://drive.google.com/file/d/ABCDEFGHIJ/view"]);
});

test("una imagen que no se puede bajar deja el evento creado y lo reporta como aviso", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioImportacionEventos(
    repositorio,
    new ImagenesFalsas({ tipo: "fallo", mensaje: "El enlace pide permiso." })
  );

  const archivo = await archivoCon([
    [
      "Noche de talentos",
      "Presentaciones de música y danza de los clubes del campus.",
      "Festival",
      "Recreativa",
      "2026-12-10",
      "18:00",
      "",
      "21:00",
      "Auditorio",
      "",
      "",
      "",
      "https://drive.google.com/file/d/ABCDEFGHIJ/view",
    ],
  ]);

  const resultado = await servicio.importar(archivo, 9, AHORA);

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;
  assert.equal(resultado.guardadas, 1);
  assert.equal(repositorio.creados[0].datos.imagenUrl, null);
  assert.equal(resultado.avisos.length, 1);
  assert.match(resultado.avisos[0].mensaje, /sin imagen/);
});

test("volver a cargar el mismo archivo no crea nada", async () => {
  const existente = claveDeEvento("Noche de talentos", new Date("2026-12-11T00:00:00.000Z"));
  const repositorio = new RepositorioFalso([existente]);
  const servicio = new ServicioImportacionEventos(
    repositorio,
    new ImagenesFalsas({ tipo: "guardada", url: "/api/imagenes/x.jpg" })
  );

  const archivo = await archivoCon([
    [
      "Noche de talentos",
      "Presentaciones de música y danza de los clubes del campus.",
      "Festival",
      "Recreativa",
      "2026-12-10",
      "18:00",
      "",
      "21:00",
      "Auditorio",
      "",
      "",
      "",
      "",
    ],
  ]);

  const resultado = await servicio.importar(archivo, 9, AHORA);

  assert.equal(resultado.tipo, "sin_filas_nuevas");
  if (resultado.tipo !== "sin_filas_nuevas") return;
  assert.equal(resultado.repetidas.length, 1);
  assert.deepEqual(repositorio.creados, []);
});
