import ExcelJS from "exceljs";

import {
  ALIAS_COLUMNAS,
  ALIAS_HORARIO,
  partirHorario,
} from "@/lib/horas-beca/columnas-importacion";
import {
  buscarColumna,
  fechaDeCelda,
  horaDeCelda,
  localizarEncabezados,
  textoDeCelda,
} from "@/lib/importacion/celdas";

export { fechaDeCelda, horaDeCelda };

/**
 * Columnas que espera el importador, en el orden de la plantilla.
 *
 * El horario se pide en dos columnas y no en una sola porque quien llena la hoja
 * escribe la hora de entrada y la de salida por separado; unirlas en
 * "14:00-16:00" es trabajo del importador, no de quien captura.
 */
export const COLUMNAS_IMPORTACION = [
  "Carnet",
  "Nombre del estudiante",
  "Fecha de la actividad",
  "Hora de inicio",
  "Hora de fin",
  "Actividad",
  "Cantidad de horas",
  "Observaciones",
] as const;

/**
 * Columnas sin las que el archivo no puede leerse.
 *
 * Observaciones es opcional, y el horario se comprueba aparte porque puede
 * venir en dos columnas de hora o en una sola de rango.
 */
const COLUMNAS_OBLIGATORIAS = [
  "Carnet",
  "Nombre del estudiante",
  "Fecha de la actividad",
  "Actividad",
  "Cantidad de horas",
] as const;

/** Lo que se nombra cuando el archivo no trae el horario de ninguna forma. */
const FALTA_HORARIO = "Horario de apoyo (o Hora de inicio y Hora de fin)";

/** Filas de datos que admite un archivo, sin contar la de encabezados. */
export const MAXIMO_FILAS_IMPORTACION = 2000;

/** Una fila del archivo tal como se leyó, antes de validarla. */
export type FilaCruda = {
  /** Número de fila en la hoja, contando la de encabezados. */
  fila: number;
  carnet: string;
  nombreEstudiante: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  descripcionActividad: string;
  cantidadHoras: string;
  observaciones: string;
};

export type ResultadoLectura =
  | { tipo: "leido"; filas: FilaCruda[] }
  | { tipo: "sin_columnas"; faltantes: string[] }
  | { tipo: "demasiadas_filas"; total: number; maximo: number }
  | { tipo: "ilegible" };

/**
 * Lee el archivo y devuelve sus filas sin validarlas.
 *
 * Las columnas se localizan por su encabezado y no por su posición: AEUVG puede
 * tener una columna extra o reordenarlas, y exigir un orden exacto convertiría
 * cualquier hoja ligeramente distinta en un archivo ilegible.
 */
export async function leerFilasDeExcel(archivo: Buffer): Promise<ResultadoLectura> {
  const libro = new ExcelJS.Workbook();

  try {
    await libro.xlsx.load(archivo as unknown as ArrayBuffer);
  } catch {
    return { tipo: "ilegible" };
  }

  const hoja = libro.worksheets[0];
  if (!hoja) return { tipo: "ilegible" };

  // Los encabezados se comparan normalizados, así que "CARNÉ" y "Carnet" son el
  // mismo. Ver columnas-importacion.ts para los nombres que admite cada uno.
  const encabezados = localizarEncabezados(hoja);

  const indice = (columna: keyof typeof ALIAS_COLUMNAS): number | undefined =>
    buscarColumna(encabezados, ALIAS_COLUMNAS[columna]);

  const columnaHorario = buscarColumna(encabezados, ALIAS_HORARIO);
  // La hoja de AEUVG trae el horario entero en una celda; la plantilla, en dos
  // columnas de hora. Las dos columnas mandan cuando están.
  const horarioJunto =
    indice("Hora de inicio") === undefined || indice("Hora de fin") === undefined;

  const faltantes: string[] = COLUMNAS_OBLIGATORIAS.filter(
    (columna) => indice(columna) === undefined
  );
  if (horarioJunto && columnaHorario === undefined) faltantes.push(FALTA_HORARIO);

  if (faltantes.length > 0) return { tipo: "sin_columnas", faltantes };

  const filas: FilaCruda[] = [];

  for (let numero = 2; numero <= hoja.rowCount; numero += 1) {
    const fila = hoja.getRow(numero);
    const celda = (columna: keyof typeof ALIAS_COLUMNAS) =>
      fila.getCell(indice(columna) ?? 1).value;

    const horario =
      horarioJunto && columnaHorario !== undefined
        ? partirHorario(textoDeCelda(fila.getCell(columnaHorario).value))
        : { inicio: horaDeCelda(celda("Hora de inicio")), fin: horaDeCelda(celda("Hora de fin")) };

    const cruda: FilaCruda = {
      fila: numero,
      carnet: textoDeCelda(celda("Carnet")),
      nombreEstudiante: textoDeCelda(celda("Nombre del estudiante")),
      fechaActividad: fechaDeCelda(celda("Fecha de la actividad")),
      horaInicio: horario.inicio,
      horaFin: horario.fin,
      descripcionActividad: textoDeCelda(celda("Actividad")),
      cantidadHoras: textoDeCelda(celda("Cantidad de horas")),
      observaciones:
        indice("Observaciones") === undefined ? "" : textoDeCelda(celda("Observaciones")),
    };

    // Una fila enteramente vacía es el relleno que deja Excel al final de la
    // hoja; contarla como error llenaría el reporte de ruido.
    const vacia = Object.entries(cruda).every(([clave, valor]) => clave === "fila" || valor === "");
    if (!vacia) filas.push(cruda);

    if (filas.length > MAXIMO_FILAS_IMPORTACION) {
      return { tipo: "demasiadas_filas", total: filas.length, maximo: MAXIMO_FILAS_IMPORTACION };
    }
  }

  return { tipo: "leido", filas };
}
