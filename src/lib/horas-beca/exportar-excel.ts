import ExcelJS from "exceljs";

import {
  COLUMNAS_EXPORTACION,
  valoresDeFila,
  type ContenidoExportacion,
} from "@/lib/horas-beca/exportacion";

/** Ancho de cada columna, en caracteres aproximados. */
const ANCHOS = [12, 32, 26, 18, 16, 46, 8, 14, 20, 28];

/**
 * Registros de horas beca en un libro de Excel.
 *
 * A diferencia del CSV, aquí las horas van como número y no como texto: AEUVG
 * suma y filtra sobre el archivo descargado, y una columna de texto obligaría a
 * convertirla a mano antes de poder usarla.
 */
export async function generarExcel(contenido: ContenidoExportacion): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Horas beca");

  hoja.columns = COLUMNAS_EXPORTACION.map((titulo, indice) => ({
    header: titulo,
    width: ANCHOS[indice],
  }));

  // La fila de encabezados se congela para que siga a la vista al desplazarse.
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };

  for (const fila of contenido.filas) hoja.addRow(valoresDeFila(fila));

  // Las horas son la séptima columna desde que la facultad entró en tercera.
  hoja.getColumn(7).numFmt = "0.00";

  // El resumen del periodo va en su propia hoja: mezclarlo con el detalle
  // impediría ordenar o filtrar la tabla sin arrastrarlo.
  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Concepto", width: 32 },
    { header: "Valor", width: 16 },
  ];
  resumen.getRow(1).font = { bold: true };
  resumen.addRows([
    ["Registros", contenido.resumen.registros],
    ["Horas registradas", contenido.resumen.horasTotales],
    ["Horas acreditadas", contenido.resumen.horasAcreditadas],
    ["Horas pendientes", contenido.resumen.horasPendientes],
    ["Registros sin cuenta vinculada", contenido.resumen.registrosSinCuenta],
  ]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
