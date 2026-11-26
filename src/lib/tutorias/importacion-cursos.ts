import ExcelJS from "exceljs";

import { buscarColumna, localizarEncabezados, textoDeCelda } from "@/lib/importacion/celdas";
import type { ProblemaArchivo } from "@/lib/importacion/reporte";
import {
  ALIAS_COLUMNAS_CURSO,
  COLUMNAS_OBLIGATORIAS_CURSO,
  type ColumnaCurso,
} from "@/lib/tutorias/columnas-importacion-cursos";

/**
 * Filas que admite un archivo de cursos.
 *
 * El pensum completo de la universidad son cientos de cursos, no decenas como
 * las asociaciones, así que el tope es más alto: cabe el catálogo entero en un
 * solo archivo y aun así un archivo disparatado no tumba el servidor.
 */
export const MAXIMO_FILAS_CURSOS = 2000;

/** Una fila del archivo tal como se leyó, antes de validarla. */
export type FilaCrudaCurso = {
  /** Número de fila en la hoja, contando la de encabezados. */
  fila: number;
  codigo: string;
  nombre: string;
};

export type LecturaCursos = { tipo: "leido"; filas: FilaCrudaCurso[] } | ProblemaArchivo;

/** Lee el archivo de cursos y devuelve sus filas sin validarlas. */
export async function leerFilasDeCursos(archivo: Buffer): Promise<LecturaCursos> {
  const libro = new ExcelJS.Workbook();

  try {
    await libro.xlsx.load(archivo as unknown as ArrayBuffer);
  } catch {
    return { tipo: "ilegible" };
  }

  const hoja = libro.worksheets[0];
  if (!hoja) return { tipo: "ilegible" };

  const encabezados = localizarEncabezados(hoja);
  const indice = (columna: ColumnaCurso): number | undefined =>
    buscarColumna(encabezados, ALIAS_COLUMNAS_CURSO[columna]);

  const faltantes = COLUMNAS_OBLIGATORIAS_CURSO.filter((columna) => indice(columna) === undefined);
  if (faltantes.length > 0) return { tipo: "sin_columnas", faltantes: [...faltantes] };

  const filas: FilaCrudaCurso[] = [];

  for (let numero = 2; numero <= hoja.rowCount; numero += 1) {
    const fila = hoja.getRow(numero);
    const texto = (columna: ColumnaCurso) => {
      const posicion = indice(columna);
      return posicion === undefined ? "" : textoDeCelda(fila.getCell(posicion).value);
    };

    const cruda: FilaCrudaCurso = {
      fila: numero,
      codigo: texto("Código"),
      nombre: texto("Nombre del curso"),
    };

    // Una fila enteramente vacía es el relleno que deja Excel al final de la
    // hoja; contarla como error llenaría el reporte de ruido.
    if (cruda.codigo !== "" || cruda.nombre !== "") filas.push(cruda);

    if (filas.length > MAXIMO_FILAS_CURSOS) {
      return { tipo: "demasiadas_filas", total: filas.length, maximo: MAXIMO_FILAS_CURSOS };
    }
  }

  return { tipo: "leido", filas };
}
