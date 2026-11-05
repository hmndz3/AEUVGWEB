import {
  listarRegistrosHoraBeca,
  obtenerResumenHorasBeca,
  type RegistroHoraBecaAdmin,
  type ResumenHorasBeca,
} from "@/lib/horas-beca/consultas-horas-beca";
import {
  formatearFechaAcreditacion,
  formatearFechaActividad,
  nombreVisibleDelRegistro,
} from "@/lib/horas-beca/formato-horas";
import { ETIQUETAS_ESTADO_HORA_BECA, type FiltrosHorasBeca } from "@/validators/horas-beca";

/**
 * Registros que admite una exportación.
 *
 * El archivo se arma entero en memoria antes de enviarlo, así que un periodo sin
 * acotar con miles de registros tumbaría el servidor justo cuando AEUVG necesita
 * el reporte. Con este límite, la exportación se rechaza con una explicación y
 * quien la pidió acota el periodo.
 */
export const MAXIMO_REGISTROS_EXPORTACION = 5000;

/** Encabezados del archivo, en el orden en que salen las columnas. */
export const COLUMNAS_EXPORTACION = [
  "Carnet",
  "Estudiante",
  "Facultad",
  "Fecha de la actividad",
  "Horario",
  "Actividad",
  "Horas",
  "Estado",
  "Fecha de acreditación",
  "Acreditado por",
] as const;

/** Una fila del archivo, ya con todo convertido a texto salvo las horas. */
export type FilaExportacion = {
  carnet: string;
  estudiante: string;
  /** Vacía mientras el carnet no tenga cuenta: la facultad sale de su carrera. */
  facultad: string;
  fechaActividad: string;
  horario: string;
  actividad: string;
  horas: number;
  estado: string;
  fechaAcreditacion: string;
  acreditadoPor: string;
};

export type ContenidoExportacion = {
  filas: FilaExportacion[];
  resumen: ResumenHorasBeca;
};

export type ResultadoExportacion =
  | ({ tipo: "listo" } & ContenidoExportacion)
  | { tipo: "demasiados"; total: number; maximo: number };

/**
 * Convierte un registro a su fila del archivo.
 *
 * Los tres formatos comparten esta conversión para que el CSV, el Excel y el
 * PDF digan exactamente lo mismo: si cada uno formateara por su cuenta, con el
 * tiempo una columna acabaría distinta en un archivo y en otro.
 */
export function aFilaExportacion(registro: RegistroHoraBecaAdmin): FilaExportacion {
  return {
    carnet: registro.carnet,
    estudiante: nombreVisibleDelRegistro(registro),
    facultad: registro.facultad ?? "",
    fechaActividad: formatearFechaActividad(registro.fechaActividad),
    horario: registro.horarioApoyo,
    actividad: registro.descripcionActividad,
    horas: registro.cantidadHoras,
    estado: ETIQUETAS_ESTADO_HORA_BECA[registro.estado],
    fechaAcreditacion: registro.fechaAcreditacion
      ? formatearFechaAcreditacion(registro.fechaAcreditacion)
      : "",
    acreditadoPor: registro.acreditadoPor ?? "",
  };
}

/** Los valores de una fila en el orden de COLUMNAS_EXPORTACION. */
export function valoresDeFila(fila: FilaExportacion): (string | number)[] {
  return [
    fila.carnet,
    fila.estudiante,
    fila.facultad,
    fila.fechaActividad,
    fila.horario,
    fila.actividad,
    fila.horas,
    fila.estado,
    fila.fechaAcreditacion,
    fila.acreditadoPor,
  ];
}

/**
 * Nombre del archivo descargado.
 *
 * Lleva la fecha en que se generó porque AEUVG descarga el mismo reporte varias
 * veces a lo largo de un periodo, y sin fecha los archivos se pisan en la
 * carpeta de descargas.
 */
export function nombreArchivoExportacion(extension: string, ahora = new Date()): string {
  const dia = ahora.toISOString().slice(0, 10);

  return `horas-beca-${dia}.${extension}`;
}

/**
 * Registros que entran en la exportación, con el mismo criterio que el listado.
 *
 * Se consultan con los filtros aplicados y no todos los de la base: lo que se
 * descarga es exactamente lo que el panel está mostrando.
 */
export async function obtenerContenidoExportacion(
  filtros: FiltrosHorasBeca = {}
): Promise<ResultadoExportacion> {
  const resumen = await obtenerResumenHorasBeca(filtros);

  if (resumen.registros > MAXIMO_REGISTROS_EXPORTACION) {
    return { tipo: "demasiados", total: resumen.registros, maximo: MAXIMO_REGISTROS_EXPORTACION };
  }

  // La página se pide completa: el resumen ya confirmó que caben.
  const pagina = await listarRegistrosHoraBeca({
    filtros: { ...filtros, pagina: 1 },
    porPagina: MAXIMO_REGISTROS_EXPORTACION,
  });

  return { tipo: "listo", filas: pagina.registros.map(aFilaExportacion), resumen };
}
