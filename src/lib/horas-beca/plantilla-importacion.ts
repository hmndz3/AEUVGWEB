import ExcelJS from "exceljs";

import { COLUMNAS_IMPORTACION, MAXIMO_FILAS_IMPORTACION } from "@/lib/horas-beca/importacion";

/** Nombre con el que se descarga la plantilla. */
export const NOMBRE_PLANTILLA = "plantilla-horas-beca.xlsx";

/** Ancho de cada columna, en el orden de la plantilla. */
const ANCHOS = [12, 32, 20, 14, 14, 46, 16, 32];

/**
 * Fila de ejemplo que acompaña a la plantilla.
 *
 * Va una sola, y con datos evidentemente ficticios, porque su único trabajo es
 * mostrar el formato de la fecha y del horario. Quien llena la hoja la borra y
 * escribe encima.
 */
const EJEMPLO = [
  "24117",
  "Nombre completo del estudiante",
  "2026-10-09",
  "14:00",
  "16:00",
  "Apoyo en la Feria de Voluntariado",
  2.5,
  "Opcional",
];

/** Explicación de cada columna, para la hoja de instrucciones. */
const INDICACIONES: [string, string][] = [
  [
    "Carnet",
    "Carnet del estudiante, sin espacios. Es el dato que vincula el registro con su cuenta.",
  ],
  [
    "Nombre del estudiante",
    "Nombre completo. Si el carnet tiene cuenta, se guarda el nombre verificado.",
  ],
  ["Fecha de la actividad", "Día en que se realizó el apoyo, como 2026-10-09 o 09/10/2026."],
  ["Hora de inicio", "Hora de entrada, como 14:00. También se acepta 9:00."],
  ["Hora de fin", "Hora de salida. Debe ser posterior a la de inicio."],
  ["Actividad", "Descripción de en qué se apoyó, entre 3 y 1000 caracteres."],
  ["Cantidad de horas", "Número mayor que cero, con dos decimales como máximo."],
  ["Observaciones", "Opcional. Puede quedar vacía o quitarse la columna entera."],
];

/**
 * Plantilla de Excel para cargar registros de horas beca.
 *
 * Los encabezados se toman de la misma lista que usa el importador, así que la
 * plantilla no puede quedarse desalineada: si se agrega o se renombra una
 * columna, las dos cosas cambian a la vez. El importador localiza las columnas
 * por su nombre, de modo que reordenarlas o agregar columnas propias no rompe
 * nada; lo que no se puede es renombrarlas.
 */
export async function generarPlantilla(): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Horas beca");

  hoja.columns = COLUMNAS_IMPORTACION.map((titulo, indice) => ({
    header: titulo,
    width: ANCHOS[indice],
  }));

  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };

  hoja.addRow(EJEMPLO);
  hoja.getColumn(7).numFmt = "0.00";

  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { header: "Columna", width: 26 },
    { header: "Qué se escribe", width: 86 },
  ];
  instrucciones.getRow(1).font = { bold: true };
  instrucciones.addRows(INDICACIONES);
  instrucciones.addRow([]);
  instrucciones.addRow([
    "Límites",
    `Hasta ${MAXIMO_FILAS_IMPORTACION} filas por archivo y 5 MB de tamaño. Divide los históricos más grandes en varios archivos.`,
  ]);
  instrucciones.addRow([
    "Antes de cargar",
    "Borra la fila de ejemplo de la hoja “Horas beca”. El panel revisa el archivo y muestra las filas con problemas antes de guardar nada.",
  ]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
