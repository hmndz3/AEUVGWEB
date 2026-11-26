import ExcelJS from "exceljs";

import { buscarColumna, localizarEncabezados, textoDeCelda } from "@/lib/importacion/celdas";
import type { ProblemaArchivo } from "@/lib/importacion/reporte";
import {
  ALIAS_COLUMNAS_ORGANIZACION,
  columnasObligatorias,
  type ColumnaOrganizacion,
} from "@/lib/organizaciones/columnas-importacion";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

/**
 * Filas que admite un archivo de asociaciones o de clubes.
 *
 * El campus tiene decenas, no miles: el límite está para que un archivo mal
 * armado no tumbe el servidor, no porque se espere llegar a él.
 */
export const MAXIMO_FILAS_ORGANIZACIONES = 300;

/** Una fila del archivo tal como se leyó, antes de validarla. */
export type FilaCrudaOrganizacion = {
  /** Número de fila en la hoja, contando la de encabezados. */
  fila: number;
  nombre: string;
  siglas: string;
  descripcion: string;
  mision: string;
  vision: string;
  actividades: string;
  correo: string;
  telefono: string;
  informacionContacto: string;
  enlaceImagen: string;
  instagram: string;
  facebook: string;
  sitioWeb: string;
};

export type LecturaOrganizaciones =
  { tipo: "leido"; filas: FilaCrudaOrganizacion[] } | ProblemaArchivo;

/**
 * Lee el archivo de asociaciones o de clubes y devuelve sus filas sin
 * validarlas.
 *
 * Una misma función para los dos tipos: lo único que cambia es qué columna es
 * obligatoria y qué campos se usan después. Las columnas que no corresponden al
 * tipo se leen igual y quedan vacías, de modo que una hoja de clubes con una
 * columna "Misión" de más no estorba.
 */
export async function leerFilasDeOrganizaciones(
  archivo: Buffer,
  tipo: TipoOrganizacion
): Promise<LecturaOrganizaciones> {
  const libro = new ExcelJS.Workbook();

  try {
    await libro.xlsx.load(archivo as unknown as ArrayBuffer);
  } catch {
    return { tipo: "ilegible" };
  }

  const hoja = libro.worksheets[0];
  if (!hoja) return { tipo: "ilegible" };

  const encabezados = localizarEncabezados(hoja);
  const indice = (columna: ColumnaOrganizacion): number | undefined =>
    buscarColumna(encabezados, ALIAS_COLUMNAS_ORGANIZACION[columna]);

  const faltantes = columnasObligatorias(tipo).filter((columna) => indice(columna) === undefined);
  if (faltantes.length > 0) return { tipo: "sin_columnas", faltantes: [...faltantes] };

  const columnaNombre = tipo === "asociaciones" ? "Nombre completo" : "Nombre";
  const filas: FilaCrudaOrganizacion[] = [];

  for (let numero = 2; numero <= hoja.rowCount; numero += 1) {
    const fila = hoja.getRow(numero);
    const texto = (columna: ColumnaOrganizacion) => {
      const posicion = indice(columna);
      return posicion === undefined ? "" : textoDeCelda(fila.getCell(posicion).value);
    };

    const cruda: FilaCrudaOrganizacion = {
      fila: numero,
      nombre: texto(columnaNombre),
      siglas: texto("Siglas"),
      descripcion: texto("Descripción"),
      mision: texto("Misión"),
      vision: texto("Visión"),
      actividades: texto("Actividades"),
      correo: texto("Correo"),
      telefono: texto("Teléfono"),
      informacionContacto: texto("Información de contacto"),
      enlaceImagen: texto("Enlace de la imagen"),
      instagram: texto("Instagram"),
      facebook: texto("Facebook"),
      sitioWeb: texto("Sitio web"),
    };

    // Una fila enteramente vacía es el relleno que deja Excel al final de la
    // hoja; contarla como error llenaría el reporte de ruido.
    const vacia = Object.entries(cruda).every(([clave, dato]) => clave === "fila" || dato === "");
    if (!vacia) filas.push(cruda);

    if (filas.length > MAXIMO_FILAS_ORGANIZACIONES) {
      return {
        tipo: "demasiadas_filas",
        total: filas.length,
        maximo: MAXIMO_FILAS_ORGANIZACIONES,
      };
    }
  }

  return { tipo: "leido", filas };
}
