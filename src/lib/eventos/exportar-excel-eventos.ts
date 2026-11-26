import ExcelJS from "exceljs";

import {
  COLUMNAS_EXPORTACION_EVENTOS,
  valoresDeFilaEvento,
  type FilaExportacionEvento,
} from "@/lib/eventos/exportacion-eventos";
import {
  eventosPorCategoria,
  eventosPorMes,
  eventosPorOrganizador,
  resumirEventos,
  type EventoReporte,
} from "@/lib/eventos/metricas-eventos";

/** Ancho de cada columna, en caracteres aproximados. */
const ANCHOS = [40, 60, 22, 18, 14, 16, 12, 16, 12, 30, 36, 8, 48, 14, 10, 12];

/**
 * Reporte de eventos en un libro de Excel.
 *
 * El detalle va en una hoja y los desgloses en otras: así AEUVG puede ordenar y
 * filtrar la tabla de eventos sin arrastrar los totales, y a la vez tiene a
 * mano el resumen que se ve en pantalla sin recalcularlo.
 */
export async function generarExcelEventos(
  filas: FilaExportacionEvento[],
  eventos: EventoReporte[]
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Eventos");
  hoja.columns = COLUMNAS_EXPORTACION_EVENTOS.map((titulo, indice) => ({
    header: titulo,
    width: ANCHOS[indice],
  }));
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };

  for (const fila of filas) hoja.addRow(valoresDeFilaEvento(fila));

  const resumen = resumirEventos(eventos);
  const hojaResumen = libro.addWorksheet("Resumen");
  hojaResumen.columns = [
    { header: "Concepto", width: 36 },
    { header: "Valor", width: 16 },
  ];
  hojaResumen.getRow(1).font = { bold: true };
  hojaResumen.addRows([
    ["Eventos", resumen.eventos],
    ["Próximos", resumen.porEstado.proximo],
    ["En curso", resumen.porEstado.en_curso],
    ["Finalizados", resumen.porEstado.finalizado],
    ["Cancelados", resumen.porEstado.cancelado],
    ["Borradores", resumen.porEstado.borrador],
    ["Cupo declarado", resumen.cupo],
    ["Estudiantes que guardaron eventos", resumen.guardados],
    ["Horas beca generadas", resumen.horasBeca],
    ["Personas con horas beca", resumen.apoyos],
  ]);

  agregarDesglose(libro, "Por mes", "Mes", eventosPorMes(eventos));
  agregarDesglose(libro, "Por categoría", "Categoría", eventosPorCategoria(eventos));
  agregarDesglose(libro, "Por organizador", "Organizador", eventosPorOrganizador(eventos));

  return Buffer.from(await libro.xlsx.writeBuffer());
}

function agregarDesglose(
  libro: ExcelJS.Workbook,
  nombreHoja: string,
  encabezado: string,
  lineas: { etiqueta: string; eventos: number; guardados: number; horasBeca: number }[]
): void {
  const hoja = libro.addWorksheet(nombreHoja);
  hoja.columns = [
    { header: encabezado, width: 36 },
    { header: "Eventos", width: 12 },
    { header: "Guardados", width: 14 },
    { header: "Horas beca", width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const linea of lineas) {
    hoja.addRow([linea.etiqueta, linea.eventos, linea.guardados, linea.horasBeca]);
  }
}
