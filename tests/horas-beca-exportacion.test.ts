import assert from "node:assert/strict";
import test from "node:test";

import {
  aFilaExportacion,
  COLUMNAS_EXPORTACION,
  nombreArchivoExportacion,
  valoresDeFila,
  type FilaExportacion,
} from "../src/lib/horas-beca/exportacion";
import { escaparCampoCsv, generarCsv } from "../src/lib/horas-beca/exportar-csv";
import { generarExcel } from "../src/lib/horas-beca/exportar-excel";
import { generarPdf } from "../src/lib/horas-beca/exportar-pdf";
import { interpretarFormato } from "../src/validators/horas-beca";

const REGISTRO = {
  idRegistroHora: 1,
  carnet: "24117",
  nombreEstudiante: "Ana Lucía Morales Castillo",
  nombreCuenta: "Ana Lucía Morales Castillo",
  facultad: "Facultad de Ingeniería",
  fechaActividad: new Date("2026-10-09T00:00:00.000Z"),
  horarioApoyo: "14:00-16:00",
  descripcionActividad: "Apoyo en la Feria de Voluntariado",
  cantidadHoras: 2.5,
  estado: "ACREDITADA" as const,
  fechaAcreditacion: new Date("2026-10-10T18:00:00.000Z"),
  acreditadoPor: "Administrador Prueba",
  observaciones: null,
};

const RESUMEN = {
  registros: 1,
  horasTotales: 2.5,
  horasAcreditadas: 2.5,
  horasPendientes: 0,
  registrosSinCuenta: 0,
};

const fila = (cambios: Partial<FilaExportacion> = {}): FilaExportacion => ({
  ...aFilaExportacion(REGISTRO),
  ...cambios,
});

test("cada fila lleva un valor por columna, en el mismo orden", () => {
  assert.equal(valoresDeFila(fila()).length, COLUMNAS_EXPORTACION.length);
});

test("la fila toma el nombre de la cuenta cuando el registro está vinculado", () => {
  const convertida = aFilaExportacion({ ...REGISTRO, nombreCuenta: "Nombre Verificado" });

  assert.equal(convertida.estudiante, "Nombre Verificado");
});

test("un registro pendiente sale sin fecha de acreditación ni responsable", () => {
  const convertida = aFilaExportacion({
    ...REGISTRO,
    estado: "PENDIENTE",
    fechaAcreditacion: null,
    acreditadoPor: null,
  });

  assert.equal(convertida.fechaAcreditacion, "");
  assert.equal(convertida.acreditadoPor, "");
  assert.equal(convertida.estado, "Pendiente");
});

/*
 * Un campo con el separador, comillas o saltos de línea rompería las columnas
 * si se escribiera tal cual: la convención del formato es encerrarlo entre
 * comillas y duplicar las que lleve dentro.
 */
test("el csv escapa los campos que romperían las columnas", () => {
  assert.equal(escaparCampoCsv("Apoyo en biblioteca"), "Apoyo en biblioteca");
  assert.equal(escaparCampoCsv("Apoyo; limpieza"), '"Apoyo; limpieza"');
  assert.equal(escaparCampoCsv('Dijo "hola"'), '"Dijo ""hola"""');
  assert.equal(escaparCampoCsv("Primera\nSegunda"), '"Primera\nSegunda"');
});

test("el csv empieza con la marca que hace que Excel respete los acentos", () => {
  const csv = generarCsv([fila()]);

  assert.equal(csv.startsWith("﻿"), true);
  assert.ok(csv.includes("Ana Lucía Morales Castillo"));
});

test("el csv lleva una línea de encabezados y una por registro", () => {
  const csv = generarCsv([fila(), fila({ carnet: "24263" })]);
  const lineas = csv.trim().split("\r\n");

  assert.equal(lineas.length, 3);
  assert.ok(lineas[0].includes("Carnet"));
  assert.ok(lineas[2].includes("24263"));
});

test("sin registros el csv conserva sus encabezados", () => {
  const lineas = generarCsv([]).trim().split("\r\n");

  assert.equal(lineas.length, 1);
  assert.ok(lineas[0].includes("Estudiante"));
});

test("el nombre del archivo lleva la fecha en que se generó", () => {
  const nombre = nombreArchivoExportacion("xlsx", new Date("2026-11-03T15:00:00.000Z"));

  assert.equal(nombre, "horas-beca-2026-11-03.xlsx");
});

test("solo se reconocen los tres formatos previstos", () => {
  assert.equal(interpretarFormato("csv"), "csv");
  assert.equal(interpretarFormato("excel"), "excel");
  assert.equal(interpretarFormato("pdf"), "pdf");
  assert.equal(interpretarFormato("docx"), null);
  assert.equal(interpretarFormato(null), null);
});

/*
 * Los dos formatos binarios se comprueban por su firma: un .xlsx es un ZIP, que
 * empieza con "PK", y un PDF empieza con "%PDF". Si la librería cambiara de
 * versión y dejara de producir un archivo válido, esto lo detecta.
 */
test("el excel generado es un archivo válido y no está vacío", async () => {
  const libro = await generarExcel({ filas: [fila()], resumen: RESUMEN });

  assert.ok(libro.length > 1000);
  assert.equal(libro.subarray(0, 2).toString("latin1"), "PK");
});

test("el pdf generado es un archivo válido y no está vacío", async () => {
  const documento = await generarPdf({ filas: [fila()], resumen: RESUMEN });

  assert.ok(documento.length > 1000);
  assert.equal(documento.subarray(0, 4).toString("latin1"), "%PDF");
});

test("el pdf aguanta un listado largo sin fallar al paginar", async () => {
  const muchas = Array.from({ length: 120 }, (_, indice) => fila({ carnet: `2${indice}` }));
  const documento = await generarPdf({ filas: muchas, resumen: RESUMEN });

  assert.equal(documento.subarray(0, 4).toString("latin1"), "%PDF");
});
