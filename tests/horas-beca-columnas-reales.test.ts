import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  aHora24,
  normalizarEncabezado,
  partirHorario,
} from "../src/lib/horas-beca/columnas-importacion";
import { leerFilasDeExcel } from "../src/lib/horas-beca/importacion";
import { validarFilas } from "../src/lib/horas-beca/validacion-importacion";

/**
 * Encabezados de la hoja con la que AEUVG lleva el control, tal como están
 * escritos en el archivo: en mayúsculas, con tilde y con el horario entero en
 * una sola columna.
 */
const ENCABEZADOS_AEUVG = [
  "FECHA",
  "NOMBRE COMPLETO",
  "CARNÉ",
  "CORREO",
  "HORARIO DE APOYO",
  "ACTIVIDAD DE APOYO",
  "HORAS A ACREDITAR",
];

async function archivoDeExcel(encabezados: string[], filas: unknown[][]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Horas");

  hoja.addRow(encabezados);
  for (const fila of filas) hoja.addRow(fila);

  return Buffer.from(await libro.xlsx.writeBuffer());
}

test("el encabezado se compara sin acentos, sin mayúsculas y sin puntos", () => {
  assert.equal(normalizarEncabezado("CARNÉ"), "carne");
  assert.equal(normalizarEncabezado("  Nombre   Completo "), "nombre completo");
  assert.equal(normalizarEncabezado("No. de carnet"), "no de carnet");
});

test("una hora suelta se lleva a 24 horas", () => {
  assert.equal(aHora24("14:00"), "14:00");
  assert.equal(aHora24("9:00"), "09:00");
  assert.equal(aHora24("2:00 pm"), "14:00");
  assert.equal(aHora24("2 pm"), "14:00");
  assert.equal(aHora24("12:30 am"), "00:30");
  assert.equal(aHora24("12:30 p.m."), "12:30");
  assert.equal(aHora24("tarde"), null);
  assert.equal(aHora24("25:00"), null);
});

test("el horario de una sola celda se parte en sus dos horas", () => {
  assert.deepEqual(partirHorario("14:00-16:00"), { inicio: "14:00", fin: "16:00" });
  assert.deepEqual(partirHorario("8:00 a 12:00"), { inicio: "08:00", fin: "12:00" });
  assert.deepEqual(partirHorario("2:00 pm – 4:00 pm"), { inicio: "14:00", fin: "16:00" });
  assert.deepEqual(partirHorario("de 8 a 10"), { inicio: "", fin: "" });
  assert.deepEqual(partirHorario("todo el día"), { inicio: "", fin: "" });
});

test("el importador lee la hoja de AEUVG con sus propios encabezados", async () => {
  const archivo = await archivoDeExcel(ENCABEZADOS_AEUVG, [
    [
      "2026-10-09",
      "Ana Lucía Morales Castillo",
      "24117",
      "mor24117@uvg.edu.gt",
      "14:00-16:00",
      "Apoyo en la Feria de Voluntariado",
      "2.5",
    ],
  ]);

  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;

  assert.deepEqual(lectura.filas, [
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
  ]);
});

test("la fila de la hoja de AEUVG pasa la validación tal como viene", async () => {
  const archivo = await archivoDeExcel(ENCABEZADOS_AEUVG, [
    [
      "09/10/2026",
      "Ana Lucía Morales Castillo",
      "24117",
      "mor24117@uvg.edu.gt",
      "8:00 a 12:00",
      "Apoyo en biblioteca",
      "4",
    ],
  ]);

  const lectura = await leerFilasDeExcel(archivo);
  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;

  const { validas, errores } = validarFilas(lectura.filas);

  assert.deepEqual(errores, []);
  assert.equal(validas[0].datos.horarioApoyo, "08:00-12:00");
  assert.equal(validas[0].datos.cantidadHoras, 4);
});

test("la columna de correo se lee sin estorbar y no se guarda", async () => {
  const lectura = await leerFilasDeExcel(
    await archivoDeExcel(ENCABEZADOS_AEUVG, [
      ["2026-10-09", "Ana Morales", "24117", "mor24117@uvg.edu.gt", "14:00-16:00", "Apoyo", "2"],
    ])
  );

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;
  assert.equal(Object.values(lectura.filas[0]).includes("mor24117@uvg.edu.gt"), false);
});

test("un horario que no se entiende deja la fila con su error, no con una hora inventada", async () => {
  const archivo = await archivoDeExcel(ENCABEZADOS_AEUVG, [
    ["2026-10-09", "Ana Morales", "24117", "mor24117@uvg.edu.gt", "todo el día", "Apoyo", "2"],
  ]);

  const lectura = await leerFilasDeExcel(archivo);
  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;

  const { validas, errores } = validarFilas(lectura.filas);

  assert.equal(validas.length, 0);
  assert.equal(errores[0].campo, "Horario de apoyo");
});

test("las dos columnas de hora mandan cuando la hoja trae las dos formas", async () => {
  const archivo = await archivoDeExcel(
    [...ENCABEZADOS_AEUVG, "Hora de inicio", "Hora de fin"],
    [
      [
        "2026-10-09",
        "Ana Morales",
        "24117",
        "mor24117@uvg.edu.gt",
        "14:00-16:00",
        "Apoyo",
        "2",
        "08:00",
        "10:00",
      ],
    ]
  );

  const lectura = await leerFilasDeExcel(archivo);

  assert.equal(lectura.tipo, "leido");
  if (lectura.tipo !== "leido") return;
  assert.equal(lectura.filas[0].horaInicio, "08:00");
  assert.equal(lectura.filas[0].horaFin, "10:00");
});

test("a una hoja sin horario de ninguna forma se le dice qué le falta", async () => {
  const lectura = await leerFilasDeExcel(
    await archivoDeExcel(
      ["FECHA", "NOMBRE COMPLETO", "CARNÉ", "ACTIVIDAD DE APOYO", "HORAS A ACREDITAR"],
      [["2026-10-09", "Ana Morales", "24117", "Apoyo", "2"]]
    )
  );

  assert.equal(lectura.tipo, "sin_columnas");
  assert.deepEqual(lectura.tipo === "sin_columnas" ? lectura.faltantes : [], [
    "Horario de apoyo (o Hora de inicio y Hora de fin)",
  ]);
});
