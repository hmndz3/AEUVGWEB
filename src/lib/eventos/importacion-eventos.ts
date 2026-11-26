import ExcelJS from "exceljs";

import {
  ALIAS_COLUMNAS_EVENTO,
  COLUMNAS_OBLIGATORIAS_EVENTO,
  type ColumnaEvento,
} from "@/lib/eventos/columnas-importacion";
import {
  buscarColumna,
  fechaDeCelda,
  horaDeCelda,
  localizarEncabezados,
  textoDeCelda,
} from "@/lib/importacion/celdas";
import type { ProblemaArchivo } from "@/lib/importacion/reporte";

/**
 * Filas de eventos que admite un archivo.
 *
 * Es menos que en horas beca porque cada fila puede traer el enlace de una
 * imagen y el servidor la descarga al importar: mil descargas en una sola
 * petición no terminarían nunca.
 */
export const MAXIMO_FILAS_EVENTOS = 300;

/** Una fila del archivo tal como se leyó, antes de validarla. */
export type FilaCrudaEvento = {
  /** Número de fila en la hoja, contando la de encabezados. */
  fila: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipoActividad: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  ubicacion: string;
  organizador: string;
  cupo: string;
  informacionAdicional: string;
  enlaceImagen: string;
};

export type LecturaEventos = { tipo: "leido"; filas: FilaCrudaEvento[] } | ProblemaArchivo;

/**
 * Lee el archivo de eventos y devuelve sus filas sin validarlas.
 *
 * Las columnas se localizan por su encabezado y no por su posición: cada
 * organizador llena la plantilla a su manera y puede agregar columnas propias
 * —un responsable, un presupuesto— que a la plataforma no le estorban.
 */
export async function leerFilasDeEventos(archivo: Buffer): Promise<LecturaEventos> {
  const libro = new ExcelJS.Workbook();

  try {
    await libro.xlsx.load(archivo as unknown as ArrayBuffer);
  } catch {
    return { tipo: "ilegible" };
  }

  const hoja = libro.worksheets[0];
  if (!hoja) return { tipo: "ilegible" };

  const encabezados = localizarEncabezados(hoja);
  const indice = (columna: ColumnaEvento): number | undefined =>
    buscarColumna(encabezados, ALIAS_COLUMNAS_EVENTO[columna]);

  const faltantes = COLUMNAS_OBLIGATORIAS_EVENTO.filter((columna) => indice(columna) === undefined);
  if (faltantes.length > 0) return { tipo: "sin_columnas", faltantes: [...faltantes] };

  const filas: FilaCrudaEvento[] = [];

  for (let numero = 2; numero <= hoja.rowCount; numero += 1) {
    const fila = hoja.getRow(numero);
    const valor = (columna: ColumnaEvento) => {
      const posicion = indice(columna);
      return posicion === undefined ? undefined : fila.getCell(posicion).value;
    };
    const texto = (columna: ColumnaEvento) => textoDeCelda(valor(columna) ?? null);

    const cruda: FilaCrudaEvento = {
      fila: numero,
      nombre: texto("Nombre del evento"),
      descripcion: texto("Descripción"),
      categoria: texto("Categoría"),
      tipoActividad: texto("Tipo de actividad"),
      fechaInicio: fechaDeCelda(valor("Fecha de inicio") ?? null),
      horaInicio: horaDeCelda(valor("Hora de inicio") ?? null),
      fechaFin: fechaDeCelda(valor("Fecha de fin") ?? null),
      horaFin: horaDeCelda(valor("Hora de fin") ?? null),
      ubicacion: texto("Ubicación"),
      organizador: texto("Organizador"),
      cupo: texto("Cupo"),
      informacionAdicional: texto("Información adicional"),
      enlaceImagen: texto("Enlace de la imagen"),
    };

    // Una fila enteramente vacía es el relleno que deja Excel al final de la
    // hoja; contarla como error llenaría el reporte de ruido.
    const vacia = Object.entries(cruda).every(([clave, dato]) => clave === "fila" || dato === "");
    if (!vacia) filas.push(cruda);

    if (filas.length > MAXIMO_FILAS_EVENTOS) {
      return { tipo: "demasiadas_filas", total: filas.length, maximo: MAXIMO_FILAS_EVENTOS };
    }
  }

  return { tipo: "leido", filas };
}
