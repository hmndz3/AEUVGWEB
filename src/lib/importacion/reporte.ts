/**
 * Reporte de una importación por archivo, igual para todas las secciones.
 *
 * Las tres listas responden preguntas distintas y por eso no se mezclan: los
 * errores son filas que hay que corregir, las repetidas son filas que no hacía
 * falta volver a cargar, y los avisos son detalles de filas que sí entraron.
 * Juntarlas obligaría a leer el motivo de cada línea para saber si algo quedó
 * pendiente.
 */

/** Fila que no se guardó porque sus datos no pasan la validación. */
export type ErrorFilaImportacion = {
  /** Número de fila en la hoja, tal como lo muestra Excel. */
  fila: number;
  /** Con qué se reconoce la fila en el archivo: el nombre del evento o del grupo. */
  referencia: string;
  campo: string;
  mensaje: string;
};

/** Fila que se dejó fuera a propósito, sin ser un error de quien la escribió. */
export type FilaOmitida = { fila: number; referencia: string; mensaje: string };

/** Detalle de una fila que sí se guardó, pero no entera. */
export type AvisoFila = { fila: number; referencia: string; mensaje: string };

export type ResumenImportacion = {
  /** Filas con datos que trae el archivo, sin contar la de encabezados. */
  total: number;
  /** Filas listas para guardarse, o ya guardadas. */
  correctas: number;
  /** Filas con problemas de validación. */
  fallidas: number;
  errores: ErrorFilaImportacion[];
  /** Filas que ya existían en la plataforma o repetidas dentro del archivo. */
  repetidas: FilaOmitida[];
  avisos: AvisoFila[];
};

/** Problemas que impiden leer el archivo completo, antes de mirar sus filas. */
export type ProblemaArchivo =
  | { tipo: "sin_columnas"; faltantes: string[] }
  | { tipo: "demasiadas_filas"; total: number; maximo: number }
  | { tipo: "ilegible" };

export type ResultadoRevisionArchivo =
  ({ tipo: "revisado" } & ResumenImportacion) | ProblemaArchivo;

export type ResultadoImportacionArchivo =
  | ({ tipo: "importado"; guardadas: number } & ResumenImportacion)
  | ProblemaArchivo
  | ({ tipo: "sin_filas_nuevas" } & ResumenImportacion);
