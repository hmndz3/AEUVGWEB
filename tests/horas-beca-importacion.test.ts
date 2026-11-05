import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  COLUMNAS_IMPORTACION,
  fechaDeCelda,
  horaDeCelda,
  leerFilasDeExcel,
} from "../src/lib/horas-beca/importacion";
import type { EstudianteDeCarnet } from "../src/lib/horas-beca/repositorio-horas-beca";
import type {
  DatosImportacion,
  RegistroImportado,
  RepositorioImportacion,
} from "../src/lib/horas-beca/repositorio-importacion";
import { ServicioImportacionHoras } from "../src/lib/horas-beca/servicio-importacion";
import { validarFilas } from "../src/lib/horas-beca/validacion-importacion";

/** Una fila correcta, de la que las pruebas van cambiando una celda. */
const FILA_BUENA = [
  "24117",
  "Ana Lucía Morales Castillo",
  "2026-10-09",
  "14:00",
  "16:00",
  "Apoyo en la Feria de Voluntariado",
  "2.5",
  "",
];

/** Arma un archivo de Excel en memoria con los encabezados y filas indicados. */
async function archivoDeExcel(encabezados: readonly string[], filas: unknown[][]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Horas");

  hoja.addRow([...encabezados]);
  for (const fila of filas) hoja.addRow(fila);

  return Buffer.from(await libro.xlsx.writeBuffer());
}

/** Repositorio de mentira: deja ver qué se guardó sin tocar la base. */
class RepositorioFalso implements RepositorioImportacion {
  importaciones: DatosImportacion[] = [];
  guardados: RegistroImportado[] = [];
  consultas: string[][] = [];

  constructor(private readonly cuentas: Map<string, EstudianteDeCarnet> = new Map()) {}

  async estudiantesPorCarnet(carnets: string[]): Promise<Map<string, EstudianteDeCarnet>> {
    this.consultas.push(carnets);

    return new Map(
      carnets
        .map((carnet) => [carnet, this.cuentas.get(carnet)] as const)
        .filter((par): par is readonly [string, EstudianteDeCarnet] => par[1] !== undefined)
    );
  }

  async registrarImportacion(datos: DatosImportacion): Promise<number> {
    this.importaciones.push(datos);
    return this.importaciones.length;
  }

  async crearRegistrosImportados(registros: RegistroImportado[]): Promise<number> {
    this.guardados.push(...registros);
    return registros.length;
  }
}

test("la fecha se interpreta venga como fecha de Excel o como texto", () => {
  assert.equal(fechaDeCelda(new Date("2026-10-09T00:00:00.000Z")), "2026-10-09");
  assert.equal(fechaDeCelda("2026-10-09"), "2026-10-09");
  assert.equal(fechaDeCelda("09/10/2026"), "2026-10-09");
  assert.equal(fechaDeCelda("9-10-2026"), "2026-10-09");
  assert.equal(fechaDeCelda(null), "");
});

test("la hora admite celda con formato de hora y texto sin cero inicial", () => {
  assert.equal(horaDeCelda(new Date("1899-12-30T14:30:00.000Z")), "14:30");
  assert.equal(horaDeCelda("9:00"), "09:00");
  assert.equal(horaDeCelda("14:00"), "14:00");
});

test("las columnas se localizan por su encabezado y no por su posición", async () => {
  const desordenadas = [
    "Actividad",
    "Carnet",
    "Cantidad de horas",
    "Hora de fin",
    "Nombre del estudiante",
    "Hora de inicio",
    "Observaciones",
    "Fecha de la actividad",
  ];

  const archivo = await archivoDeExcel(desordenadas, [
    [
      "Apoyo en la Feria de Voluntariado",
      "24117",
      "2.5",
      "16:00",
      "Ana Lucía Morales Castillo",
      "14:00",
      "Llegó puntual",
      "2026-10-09",
    ],
  ]);

  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "leido");
  assert.deepEqual(lectura.tipo === "leido" ? lectura.filas : [], [
    {
      fila: 2,
      carnet: "24117",
      nombreEstudiante: "Ana Lucía Morales Castillo",
      fechaActividad: "2026-10-09",
      horaInicio: "14:00",
      horaFin: "16:00",
      descripcionActividad: "Apoyo en la Feria de Voluntariado",
      cantidadHoras: "2.5",
      observaciones: "Llegó puntual",
    },
  ]);
});

test("un archivo sin las columnas obligatorias se rechaza nombrando las que faltan", async () => {
  const archivo = await archivoDeExcel(["Carnet", "Actividad"], [["24117", "Apoyo"]]);
  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "sin_columnas");
  assert.deepEqual(lectura.tipo === "sin_columnas" ? lectura.faltantes : [], [
    "Nombre del estudiante",
    "Fecha de la actividad",
    "Cantidad de horas",
    "Horario de apoyo (o Hora de inicio y Hora de fin)",
  ]);
});

test("las observaciones son opcionales y su ausencia no impide leer el archivo", async () => {
  const sinObservaciones = COLUMNAS_IMPORTACION.filter((columna) => columna !== "Observaciones");
  const archivo = await archivoDeExcel(sinObservaciones, [FILA_BUENA.slice(0, 7)]);

  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "leido");
  assert.equal(lectura.tipo === "leido" ? lectura.filas[0].observaciones : "x", "");
});

test("las filas enteramente vacías no se cuentan como error", async () => {
  const archivo = await archivoDeExcel(COLUMNAS_IMPORTACION, [
    FILA_BUENA,
    ["", "", "", "", "", "", "", ""],
    FILA_BUENA,
  ]);

  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "leido");
  assert.equal(lectura.tipo === "leido" ? lectura.filas.length : 0, 2);
});

test("un archivo que no es Excel se reporta como ilegible", async () => {
  const lectura = await leerFilasDeExcel(Buffer.from("carnet;nombre\n24117;Ana"));

  assert.equal(lectura.tipo, "ilegible");
});

test("la validación separa las filas correctas de las que tienen problemas", () => {
  const { validas, errores, total } = validarFilas([
    {
      fila: 2,
      carnet: "24117",
      nombreEstudiante: "Ana Lucía Morales Castillo",
      fechaActividad: "2026-10-09",
      horaInicio: "14:00",
      horaFin: "16:00",
      descripcionActividad: "Apoyo en la Feria de Voluntariado",
      cantidadHoras: "2.5",
      observaciones: "",
    },
    {
      fila: 3,
      carnet: "24118",
      nombreEstudiante: "Diego Pérez",
      fechaActividad: "2026-10-10",
      horaInicio: "16:00",
      horaFin: "14:00",
      descripcionActividad: "Apoyo en la Feria",
      cantidadHoras: "2",
      observaciones: "",
    },
  ]);

  assert.equal(total, 2);
  assert.equal(validas.length, 1);
  assert.equal(validas[0].datos.horarioApoyo, "14:00-16:00");
  assert.equal(validas[0].datos.observaciones, null);
  assert.equal(errores.length, 1);
  assert.equal(errores[0].fila, 3);
  assert.equal(errores[0].campo, "Horario de apoyo");
});

test("una fila con varios problemas se reporta una sola vez", () => {
  const { errores } = validarFilas([
    {
      fila: 2,
      carnet: "",
      nombreEstudiante: "",
      fechaActividad: "",
      horaInicio: "",
      horaFin: "",
      descripcionActividad: "",
      cantidadHoras: "",
      observaciones: "",
    },
  ]);

  assert.equal(errores.length, 1);
  assert.equal(errores[0].campo, "Carnet");
});

test("la revisión cuenta las filas sin escribir nada", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioImportacionHoras(repositorio);

  const archivo = await archivoDeExcel(COLUMNAS_IMPORTACION, [
    FILA_BUENA,
    [...FILA_BUENA.slice(0, 6), "0", ""],
  ]);

  const resultado = await servicio.revisar(archivo);

  assert.equal(resultado.tipo, "revisado");
  if (resultado.tipo !== "revisado") return;

  assert.equal(resultado.total, 2);
  assert.equal(resultado.correctas, 1);
  assert.equal(resultado.fallidas, 1);
  assert.equal(resultado.errores[0].campo, "Cantidad de horas");
  assert.equal(repositorio.guardados.length, 0);
  assert.equal(repositorio.importaciones.length, 0);
});

test("la importación guarda solo las filas correctas y deja constancia", async () => {
  const repositorio = new RepositorioFalso(
    new Map([["24117", { idEstudiante: 7, nombreCompleto: "Ana Lucía Morales Castillo" }]])
  );
  const servicio = new ServicioImportacionHoras(repositorio);

  const archivo = await archivoDeExcel(COLUMNAS_IMPORTACION, [
    FILA_BUENA,
    ["99999", "Carlos Ruiz", "2026-10-10", "08:00", "10:00", "Apoyo en biblioteca", "2", ""],
    [...FILA_BUENA.slice(0, 2), "no es fecha", ...FILA_BUENA.slice(3)],
  ]);

  const resultado = await servicio.importar(archivo, "historico.xlsx", 1);

  assert.equal(resultado.tipo, "importado");
  if (resultado.tipo !== "importado") return;

  assert.equal(resultado.total, 3);
  assert.equal(resultado.correctas, 2);
  assert.equal(resultado.fallidas, 1);
  assert.equal(repositorio.guardados.length, 2);

  // El carnet con cuenta queda vinculado y toma el nombre verificado.
  assert.equal(repositorio.guardados[0].idEstudiante, 7);
  assert.equal(repositorio.guardados[0].nombreEstudiante, "Ana Lucía Morales Castillo");

  // El que no tiene cuenta se guarda igual, con el nombre de la hoja.
  assert.equal(repositorio.guardados[1].idEstudiante, null);
  assert.equal(repositorio.guardados[1].nombreEstudiante, "Carlos Ruiz");

  const constancia = repositorio.importaciones[0];
  assert.equal(constancia.nombreArchivo, "historico.xlsx");
  assert.equal(constancia.realizadaPor, 1);
  assert.equal(constancia.totalFilas, 3);
  assert.equal(constancia.filasExitosas, 2);
  assert.equal(constancia.filasFallidas, 1);
  assert.equal(constancia.errores.length, 1);
});

test("un archivo sin una sola fila válida no escribe nada", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioImportacionHoras(repositorio);

  const archivo = await archivoDeExcel(COLUMNAS_IMPORTACION, [
    [...FILA_BUENA.slice(0, 2), "no es fecha", ...FILA_BUENA.slice(3)],
  ]);

  const resultado = await servicio.importar(archivo, "malo.xlsx", 1);

  assert.equal(resultado.tipo, "sin_filas_validas");
  assert.equal(repositorio.guardados.length, 0);
  assert.equal(repositorio.importaciones.length, 0);
});

test("el mismo estudiante repetido se consulta una sola vez", async () => {
  const repositorio = new RepositorioFalso(
    new Map([["24117", { idEstudiante: 7, nombreCompleto: "Ana Lucía Morales Castillo" }]])
  );
  const servicio = new ServicioImportacionHoras(repositorio);

  const archivo = await archivoDeExcel(COLUMNAS_IMPORTACION, [FILA_BUENA, FILA_BUENA, FILA_BUENA]);

  await servicio.importar(archivo, "repetido.xlsx", 1);

  assert.equal(repositorio.consultas.length, 1);
  assert.deepEqual(repositorio.consultas[0], ["24117"]);
});
