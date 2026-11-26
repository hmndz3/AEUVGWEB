import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import type { GuardadoDeImagenes, ResultadoImagen } from "../src/lib/importacion/guardado-imagenes";
import {
  COLUMNAS_ASOCIACIONES,
  COLUMNAS_CLUBES,
} from "../src/lib/organizaciones/columnas-importacion";
import { leerFilasDeOrganizaciones } from "../src/lib/organizaciones/importacion-organizaciones";
import {
  generarPlantillaOrganizaciones,
  hojaDePlantilla,
  nombrePlantillaOrganizaciones,
} from "../src/lib/organizaciones/plantilla-organizaciones";
import type { RepositorioImportacionOrganizaciones } from "../src/lib/organizaciones/repositorio-importacion-organizaciones";
import {
  ServicioImportacionOrganizaciones,
  type CreadorDeOrganizaciones,
} from "../src/lib/organizaciones/servicio-importacion-organizaciones";
import type { ResultadoOrganizacion } from "../src/lib/organizaciones/servicio-organizaciones";
import { validarFilasDeOrganizaciones } from "../src/lib/organizaciones/validacion-importacion-organizaciones";
import type {
  DatosRedSocialAdmin,
  EntradaOrganizacion,
  TipoOrganizacion,
} from "../src/validators/organizacion-admin";

/** Fila de asociación con todo correcto; cada prueba cambia lo que necesita. */
function filaAsociacion(cambios: Record<string, unknown> = {}) {
  return {
    fila: 2,
    nombre: "Asociación de Estudiantes de Biología",
    siglas: "AEBIO",
    descripcion: "Representamos al estudiantado de la carrera.",
    mision: "",
    vision: "",
    actividades: "",
    correo: "aebio@uvg.edu.gt",
    telefono: "",
    informacionContacto: "",
    enlaceImagen: "",
    instagram: "",
    facebook: "",
    sitioWeb: "",
    ...cambios,
  };
}

function filaClub(cambios: Record<string, unknown> = {}) {
  return filaAsociacion({ nombre: "Club de Ajedrez", siglas: "", ...cambios });
}

async function archivoCon(
  columnas: readonly string[],
  filas: (string | number)[][]
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Datos");
  hoja.addRow([...columnas]);
  filas.forEach((valores) => hoja.addRow(valores));

  return Buffer.from(await libro.xlsx.writeBuffer());
}

class RepositorioFalso implements RepositorioImportacionOrganizaciones {
  constructor(
    private readonly nombres: string[] = [],
    private readonly siglas: string[] = []
  ) {}

  async registrados() {
    return { nombres: this.nombres, siglas: this.siglas };
  }
}

class CreadorFalso implements CreadorDeOrganizaciones {
  readonly creadas: EntradaOrganizacion[] = [];
  readonly redes: { id: number; datos: DatosRedSocialAdmin }[] = [];

  constructor(private readonly fallaRed = false) {}

  async crear(entrada: EntradaOrganizacion): Promise<ResultadoOrganizacion> {
    this.creadas.push(entrada);
    return { tipo: "guardada", id: this.creadas.length };
  }

  async agregarRedSocial(
    _tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<ResultadoOrganizacion> {
    if (this.fallaRed) return { tipo: "invalida", errores: { url: "Ese enlace ya está." } };

    this.redes.push({ id, datos });
    return { tipo: "guardada", id: this.redes.length };
  }
}

class ImagenesFalsas implements GuardadoDeImagenes {
  constructor(private readonly resultado: ResultadoImagen) {}

  async guardar(): Promise<ResultadoImagen> {
    return this.resultado;
  }
}

const imagenesOk = () => new ImagenesFalsas({ tipo: "guardada", url: "/api/imagenes/logo.png" });

test("cada plantilla trae sus columnas y su hoja de instrucciones", async () => {
  for (const tipo of ["asociaciones", "clubes"] as const) {
    const plantilla = await generarPlantillaOrganizaciones(tipo);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(plantilla as unknown as ArrayBuffer);

    const columnas: string[] = [];
    libro.worksheets[0]
      .getRow(1)
      .eachCell((celda) => columnas.push(String(celda.value ?? "").trim()));

    assert.equal(libro.worksheets[0].name, hojaDePlantilla(tipo));
    assert.deepEqual(columnas, [
      ...(tipo === "asociaciones" ? COLUMNAS_ASOCIACIONES : COLUMNAS_CLUBES),
    ]);
    assert.equal(libro.worksheets[1].name, "Instrucciones");
    assert.equal(nombrePlantillaOrganizaciones(tipo), `plantilla-${tipo}.xlsx`);
  }
});

test("la fila de ejemplo de cada plantilla pasa la validación", async () => {
  for (const tipo of ["asociaciones", "clubes"] as const) {
    const lectura = await leerFilasDeOrganizaciones(
      await generarPlantillaOrganizaciones(tipo),
      tipo
    );

    assert.equal(lectura.tipo, "leido");
    if (lectura.tipo !== "leido") return;

    const { validas, errores } = validarFilasDeOrganizaciones(lectura.filas, tipo);

    assert.deepEqual(errores, []);
    assert.equal(validas.length, 1);
  }
});

test("un archivo sin la columna del nombre se reporta", async () => {
  const archivo = await archivoCon(["Correo", "Teléfono"], [["a@uvg.edu.gt", "5555 4444"]]);

  const lectura = await leerFilasDeOrganizaciones(archivo, "clubes");

  assert.equal(lectura.tipo, "sin_columnas");
  if (lectura.tipo !== "sin_columnas") return;
  assert.deepEqual(lectura.faltantes, ["Nombre"]);
});

test("las columnas se reconocen por alias y en otro orden", async () => {
  const archivo = await archivoCon(
    ["IG", "club", "que hacemos", "correo electronico"],
    [["https://instagram.com/ajedrez", "Club de Ajedrez", "Torneos cada mes", "aj@uvg.edu.gt"]]
  );

  const lectura = await leerFilasDeOrganizaciones(archivo, "clubes");

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;
  assert.equal(lectura.filas[0].nombre, "Club de Ajedrez");
  assert.equal(lectura.filas[0].actividades, "Torneos cada mes");
  assert.equal(lectura.filas[0].instagram, "https://instagram.com/ajedrez");
});

test("una ficha que ya existe por nombre o por siglas no se vuelve a crear", () => {
  const porNombre = validarFilasDeOrganizaciones([filaAsociacion()], "asociaciones", {
    nombres: ["asociacion de estudiantes de biologia"],
    siglas: [],
  });
  const porSiglas = validarFilasDeOrganizaciones([filaAsociacion()], "asociaciones", {
    nombres: [],
    siglas: ["aebio"],
  });

  assert.equal(porNombre.validas.length, 0);
  assert.match(porNombre.repetidas[0].mensaje, /ese nombre/);
  assert.equal(porSiglas.validas.length, 0);
  assert.match(porSiglas.repetidas[0].mensaje, /AEBIO/);
});

test("dos filas del mismo grupo en un archivo crean una sola ficha", () => {
  const { validas, repetidas } = validarFilasDeOrganizaciones(
    [filaClub(), filaClub({ fila: 3 })],
    "clubes"
  );

  assert.equal(validas.length, 1);
  assert.equal(repetidas.length, 1);
  assert.equal(repetidas[0].fila, 3);
});

test("sin correo ni teléfono la fila se reporta", () => {
  const { errores } = validarFilasDeOrganizaciones(
    [filaClub({ correo: "", telefono: "" })],
    "clubes"
  );

  assert.equal(errores.length, 1);
  assert.match(errores[0].mensaje, /al menos un medio de contacto/);
});

test("una asociación sin siglas se reporta en su fila", () => {
  const { errores } = validarFilasDeOrganizaciones(
    [filaAsociacion({ siglas: "" })],
    "asociaciones"
  );

  assert.equal(errores[0].campo, "Siglas o nombre corto");
});

test("un enlace de red social incompleto se reporta con la plataforma", () => {
  const { errores } = validarFilasDeOrganizaciones(
    [filaClub({ instagram: "instagram.com/ajedrez" })],
    "clubes"
  );

  assert.equal(errores[0].campo, "Instagram");
  assert.match(errores[0].mensaje, /https:\/\//);
});

test("la revisión no crea nada", async () => {
  const creador = new CreadorFalso();
  const servicio = new ServicioImportacionOrganizaciones(
    new RepositorioFalso(),
    creador,
    imagenesOk()
  );

  const archivo = await archivoCon(COLUMNAS_CLUBES, [
    ["Club de Ajedrez", "Abierto a todos.", "Torneos", "aj@uvg.edu.gt", "", "", "", "", "", ""],
  ]);

  const resultado = await servicio.revisar(archivo, "clubes");

  assert.equal(resultado.tipo, "revisado");
  if (resultado.tipo !== "revisado") return;
  assert.equal(resultado.correctas, 1);
  assert.deepEqual(creador.creadas, []);
});

test("la importación crea la ficha con su logotipo y sus redes", async () => {
  const creador = new CreadorFalso();
  const servicio = new ServicioImportacionOrganizaciones(
    new RepositorioFalso(),
    creador,
    imagenesOk()
  );

  const archivo = await archivoCon(COLUMNAS_ASOCIACIONES, [
    [
      "Asociación de Estudiantes de Biología",
      "AEBIO",
      "Representamos al estudiantado de la carrera.",
      "",
      "",
      "aebio@uvg.edu.gt",
      "5555 4444",
      "",
      "https://drive.google.com/file/d/ABCDEFGHIJ/view",
      "https://instagram.com/aebio",
      "https://facebook.com/aebio",
      "",
    ],
  ]);

  const resultado = await servicio.importar(archivo, "asociaciones");

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;
  assert.equal(resultado.guardadas, 1);
  assert.equal(creador.creadas.length, 1);
  assert.equal(creador.creadas[0].datos.imagenUrl, "/api/imagenes/logo.png");
  assert.deepEqual(
    creador.redes.map((red) => red.datos.plataforma),
    ["Instagram", "Facebook"]
  );
  assert.deepEqual(resultado.avisos, []);
});

test("una red que no se pudo agregar deja la ficha creada y lo avisa", async () => {
  const creador = new CreadorFalso(true);
  const servicio = new ServicioImportacionOrganizaciones(
    new RepositorioFalso(),
    creador,
    imagenesOk()
  );

  const archivo = await archivoCon(COLUMNAS_CLUBES, [
    [
      "Club de Ajedrez",
      "Abierto a todos.",
      "",
      "aj@uvg.edu.gt",
      "",
      "",
      "",
      "https://instagram.com/ajedrez",
      "",
      "",
    ],
  ]);

  const resultado = await servicio.importar(archivo, "clubes");

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;
  assert.equal(resultado.guardadas, 1);
  assert.equal(resultado.avisos.length, 1);
  assert.match(resultado.avisos[0].mensaje, /Instagram/);
});

test("un logotipo que no se puede bajar deja la ficha creada sin imagen", async () => {
  const creador = new CreadorFalso();
  const servicio = new ServicioImportacionOrganizaciones(
    new RepositorioFalso(),
    creador,
    new ImagenesFalsas({ tipo: "fallo", mensaje: "El enlace pide permiso." })
  );

  const archivo = await archivoCon(COLUMNAS_CLUBES, [
    [
      "Club de Ajedrez",
      "Abierto a todos.",
      "",
      "aj@uvg.edu.gt",
      "",
      "",
      "https://drive.google.com/file/d/ABCDEFGHIJ/view",
      "",
      "",
      "",
    ],
  ]);

  const resultado = await servicio.importar(archivo, "clubes");

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;
  assert.equal(creador.creadas[0].datos.imagenUrl, null);
  assert.match(resultado.avisos[0].mensaje, /sin imagen/);
});

test("volver a cargar el mismo archivo no crea nada", async () => {
  const creador = new CreadorFalso();
  const servicio = new ServicioImportacionOrganizaciones(
    new RepositorioFalso(["club de ajedrez"]),
    creador,
    imagenesOk()
  );

  const archivo = await archivoCon(COLUMNAS_CLUBES, [
    ["Club de Ajedrez", "Abierto a todos.", "", "aj@uvg.edu.gt", "", "", "", "", "", ""],
  ]);

  const resultado = await servicio.importar(archivo, "clubes");

  assert.equal(resultado.tipo, "sin_filas_nuevas");
  if (resultado.tipo !== "sin_filas_nuevas") return;
  assert.equal(resultado.repetidas.length, 1);
  assert.deepEqual(creador.creadas, []);
});
