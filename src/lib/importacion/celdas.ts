import type ExcelJS from "exceljs";

import { normalizarTexto } from "@/lib/busqueda-texto";

/**
 * Lectura de celdas de Excel, compartida por los importadores.
 *
 * Las tres secciones que se cargan por archivo —horas beca, eventos y
 * organizaciones— tropiezan con lo mismo: una celda puede venir como texto,
 * como número, como fecha real o como fórmula, según cómo esté formateada la
 * columna y quién llenó la hoja. Interpretar eso una vez y en un solo sitio
 * evita que cada importador lo resuelva a su manera.
 */

/**
 * Texto de una celda.
 *
 * Una celda con formato de fecha devuelve cadena vacía a propósito: las fechas
 * y las horas se leen con sus propias funciones, que saben qué parte tomar.
 */
export function textoDeCelda(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return "";
  if (typeof valor === "object") {
    if ("text" in valor && typeof valor.text === "string") return valor.text.trim();
    if ("result" in valor) return String(valor.result ?? "").trim();
    if ("richText" in valor)
      return valor.richText
        .map((parte) => parte.text)
        .join("")
        .trim();
    return "";
  }

  return String(valor).trim();
}

/**
 * Fecha de una celda, como día de calendario en formato AAAA-MM-DD.
 *
 * Excel puede entregarla como fecha real o como texto. Cuando es fecha real se
 * toman sus componentes en UTC, que es como la guarda el archivo: convertirla a
 * la zona local correría el día.
 */
export function fechaDeCelda(valor: ExcelJS.CellValue): string {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);

  const texto = textoDeCelda(valor);
  if (texto === "") return "";

  // Formatos que escribe la gente: 2026-10-09, 09/10/2026 o 9-10-2026.
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const latino = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (latino) {
    const [, dia, mes, anio] = latino;
    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return texto;
}

/**
 * Hora de una celda, en horas y minutos.
 *
 * Una celda con formato de hora llega como fecha; una escrita a mano, como
 * texto. Se admiten las dos, y también "9:00" sin el cero de delante.
 */
export function horaDeCelda(valor: ExcelJS.CellValue): string {
  if (valor instanceof Date) {
    const horas = String(valor.getUTCHours()).padStart(2, "0");
    const minutos = String(valor.getUTCMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
  }

  const texto = textoDeCelda(valor);
  const partes = texto.match(/^(\d{1,2}):(\d{2})/);

  return partes ? `${partes[1].padStart(2, "0")}:${partes[2]}` : texto;
}

/**
 * Hora suelta a formato de 24 horas.
 *
 * Acepta "14:00", "9:00", "2:00 pm" y "2 pm", que son las formas en las que
 * aparece escrita a mano en las hojas. Devuelve null si no se reconoce, para
 * que la fila se reporte en lugar de guardarse con una hora inventada.
 */
export function aHora24(texto: string): string | null {
  const limpio = texto.trim().toLocaleLowerCase("es").replace(/\./g, "");
  const partes = limpio.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!partes) return null;

  let horas = Number(partes[1]);
  const minutos = partes[2] ?? "00";
  const meridiano = partes[3];

  if (meridiano === "pm" && horas < 12) horas += 12;
  if (meridiano === "am" && horas === 12) horas = 0;
  if (horas > 23 || Number(minutos) > 59) return null;

  return `${String(horas).padStart(2, "0")}:${minutos}`;
}

/** Encabezado en la única forma en la que se compara. */
export function normalizarEncabezado(titulo: string): string {
  return normalizarTexto(titulo.replace(/[.:]/g, " "));
}

/**
 * Columnas de la hoja por su encabezado normalizado.
 *
 * Localizar las columnas por su nombre y no por su posición permite que la hoja
 * traiga columnas extra o en otro orden, que es lo normal cuando la llenan
 * varias personas.
 */
export function localizarEncabezados(hoja: ExcelJS.Worksheet): Map<string, number> {
  const encabezados = new Map<string, number>();

  hoja.getRow(1).eachCell((celda, columna) => {
    const titulo = normalizarEncabezado(textoDeCelda(celda.value));
    if (titulo && !encabezados.has(titulo)) encabezados.set(titulo, columna);
  });

  return encabezados;
}

/** Número de la primera columna que coincide con alguno de los alias. */
export function buscarColumna(
  encabezados: Map<string, number>,
  alias: readonly string[]
): number | undefined {
  for (const nombre of alias) {
    const columna = encabezados.get(nombre);
    if (columna !== undefined) return columna;
  }

  return undefined;
}
