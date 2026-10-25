import PDFDocument from "pdfkit";

import {
  COLUMNAS_EXPORTACION,
  valoresDeFila,
  type ContenidoExportacion,
} from "@/lib/horas-beca/exportacion";
import { formatearHoras } from "@/lib/horas-beca/formato-horas";

/** Ancho de cada columna en puntos. La suma cabe en una carta apaisada con márgenes. */
const ANCHOS = [55, 125, 70, 65, 160, 35, 60, 85, 105];

const MARGEN = 30;
const ALTO_FILA = 16;

/**
 * Registros de horas beca en PDF.
 *
 * Se arma apaisado porque son nueve columnas: en vertical, la descripción de la
 * actividad quedaría en una franja ilegible. La tabla se dibuja a mano con
 * líneas y texto, que es lo que ofrece la librería, y el encabezado se repite en
 * cada página para que una hoja suelta siga entendiéndose.
 */
export function generarPdf(contenido: ContenidoExportacion): Promise<Buffer> {
  const documento = new PDFDocument({ size: "LETTER", layout: "landscape", margin: MARGEN });
  const partes: Buffer[] = [];

  const terminado = new Promise<Buffer>((resolver, rechazar) => {
    documento.on("data", (parte: Buffer) => partes.push(parte));
    documento.on("end", () => resolver(Buffer.concat(partes)));
    documento.on("error", rechazar);
  });

  const anchoUtil = documento.page.width - MARGEN * 2;

  documento.fontSize(16).font("Helvetica-Bold").text("Horas beca", MARGEN, MARGEN);
  documento
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Generado el ${new Date().toLocaleDateString("es-GT", { timeZone: "America/Guatemala" })}`,
      { width: anchoUtil }
    );

  documento.moveDown(0.6);
  documento
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(
      `${contenido.resumen.registros} registros · ` +
        `${formatearHoras(contenido.resumen.horasTotales)} horas registradas · ` +
        `${formatearHoras(contenido.resumen.horasAcreditadas)} acreditadas · ` +
        `${formatearHoras(contenido.resumen.horasPendientes)} pendientes`
    );
  documento.moveDown(0.8);

  const dibujarEncabezado = () => {
    const y = documento.y;
    let x = MARGEN;

    documento.fontSize(8).font("Helvetica-Bold");
    COLUMNAS_EXPORTACION.forEach((titulo, indice) => {
      documento.text(titulo, x + 2, y + 4, { width: ANCHOS[indice] - 4, lineBreak: false });
      x += ANCHOS[indice];
    });

    documento
      .moveTo(MARGEN, y + ALTO_FILA)
      .lineTo(MARGEN + anchoUtil, y + ALTO_FILA)
      .lineWidth(0.8)
      .stroke();
    documento.y = y + ALTO_FILA + 2;
  };

  dibujarEncabezado();
  documento.fontSize(8).font("Helvetica");

  for (const fila of contenido.filas) {
    // Salto de página antes de que la fila se salga del área útil.
    if (documento.y + ALTO_FILA > documento.page.height - MARGEN) {
      documento.addPage();
      documento.y = MARGEN;
      dibujarEncabezado();
      documento.fontSize(8).font("Helvetica");
    }

    const y = documento.y;
    let x = MARGEN;

    valoresDeFila(fila).forEach((valor, indice) => {
      const texto = typeof valor === "number" ? formatearHoras(valor) : valor;
      // lineBreak false: una celda larga se recorta en vez de descuadrar la fila.
      documento.text(texto, x + 2, y + 3, { width: ANCHOS[indice] - 4, lineBreak: false });
      x += ANCHOS[indice];
    });

    documento.y = y + ALTO_FILA;
  }

  documento.end();

  return terminado;
}
