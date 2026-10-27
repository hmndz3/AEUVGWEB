import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { COLUMNAS_IMPORTACION, leerFilasDeExcel } from "../src/lib/horas-beca/importacion";
import { generarPlantilla, NOMBRE_PLANTILLA } from "../src/lib/horas-beca/plantilla-importacion";
import { validarFilas } from "../src/lib/horas-beca/validacion-importacion";

/** Encabezados tal como quedaron escritos en la hoja de datos. */
async function encabezadosDe(plantilla: Buffer): Promise<{ hoja: string; columnas: string[] }> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(plantilla as unknown as ArrayBuffer);

  const hoja = libro.worksheets[0];
  const columnas: string[] = [];
  hoja.getRow(1).eachCell((celda) => columnas.push(String(celda.value ?? "").trim()));

  return { hoja: hoja.name, columnas };
}

test("la plantilla es un archivo de Excel", async () => {
  const plantilla = await generarPlantilla();

  assert.ok(plantilla.length > 0);
  assert.equal(plantilla.subarray(0, 2).toString("latin1"), "PK");
  assert.equal(NOMBRE_PLANTILLA, "plantilla-horas-beca.xlsx");
});

test("los encabezados de la plantilla son los que espera el importador", async () => {
  const { hoja, columnas } = await encabezadosDe(await generarPlantilla());

  assert.equal(hoja, "Horas beca");
  assert.deepEqual(columnas, [...COLUMNAS_IMPORTACION]);
});

test("el importador lee la plantilla sin reportar columnas faltantes", async () => {
  const lectura = await leerFilasDeExcel(await generarPlantilla());

  assert.equal(lectura.tipo, "leido");
  assert.equal(lectura.tipo === "leido" ? lectura.filas.length : 0, 1);
});

test("la fila de ejemplo de la plantilla pasa la validación tal como viene", async () => {
  const lectura = await leerFilasDeExcel(await generarPlantilla());
  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;

  const { validas, errores } = validarFilas(lectura.filas);

  assert.deepEqual(errores, []);
  assert.equal(validas.length, 1);
  assert.equal(validas[0].datos.horarioApoyo, "14:00-16:00");
  assert.equal(validas[0].datos.cantidadHoras, 2.5);
  assert.equal(validas[0].datos.fechaActividad.toISOString(), "2026-10-09T00:00:00.000Z");
});

test("la plantilla incluye una hoja que explica cada columna", async () => {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load((await generarPlantilla()) as unknown as ArrayBuffer);

  const instrucciones = libro.worksheets[1];
  assert.equal(instrucciones.name, "Instrucciones");

  const explicadas = instrucciones.getColumn(1).values.map((valor) => String(valor ?? "").trim());
  for (const columna of COLUMNAS_IMPORTACION) {
    assert.ok(explicadas.includes(columna), `falta la explicación de ${columna}`);
  }
});
