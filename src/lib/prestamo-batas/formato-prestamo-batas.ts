import type {
  EstadoComprobanteTurno,
  EstadoPrestamoBata,
  TallaBata,
  TipoArticuloBata,
} from "@prisma/client";

import { aHoraDeReloj, ETIQUETAS_DIA } from "@/lib/tutorias/formato-tutorias";
import type { DiaSemana } from "@prisma/client";

/**
 * Etiquetas y cálculos del préstamo de batas.
 *
 * Reúne en un solo lugar los nombres legibles de los tipos de artículo, las
 * tallas y los estados, además del cálculo de las horas que dura un turno. Se
 * mantiene aparte de los servicios para que tanto el panel como las páginas
 * públicas presenten lo mismo sin repetir estos mapas.
 */

export const TIPOS_ARTICULO = [
  "BATA_AZUL",
  "BATA_BLANCA",
  "LENTES",
] as const satisfies readonly TipoArticuloBata[];

export const ETIQUETAS_TIPO_ARTICULO: Record<TipoArticuloBata, string> = {
  BATA_AZUL: "Bata azul",
  BATA_BLANCA: "Bata blanca",
  LENTES: "Lentes",
};

/** Tallas de bata, en el orden en que se muestran. Los lentes no llevan talla. */
export const TALLAS = ["S", "M", "L", "XL"] as const satisfies readonly TallaBata[];

export const ESTADOS_PRESTAMO = [
  "PRESTADO",
  "DEVUELTO",
] as const satisfies readonly EstadoPrestamoBata[];

export const ETIQUETAS_ESTADO_PRESTAMO: Record<EstadoPrestamoBata, string> = {
  PRESTADO: "Prestado",
  DEVUELTO: "Devuelto",
};

export const ESTADOS_COMPROBANTE = [
  "PENDIENTE",
  "APROBADO",
  "RECHAZADO",
] as const satisfies readonly EstadoComprobanteTurno[];

export const ETIQUETAS_ESTADO_COMPROBANTE: Record<EstadoComprobanteTurno, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

/** Un artículo es bata cuando no es el par de lentes compartido. */
export function esBata(tipo: TipoArticuloBata): boolean {
  return tipo !== "LENTES";
}

/**
 * Horas que dura un turno, con dos decimales.
 *
 * Las horas se guardan como `time(0)` y Prisma las entrega como `Date` sobre el
 * 1 de enero de 1970 en UTC, igual que la disponibilidad de los tutores, así
 * que la resta se hace en ese mismo marco. Un turno de 6:45 a 9:00 son 2.25
 * horas, que es exactamente lo que se acredita al voluntario.
 */
export function duracionHorasTurno(horaInicio: Date, horaFin: Date): number {
  const milisegundos = horaFin.getTime() - horaInicio.getTime();
  const horas = milisegundos / (1000 * 60 * 60);

  return Math.round(horas * 100) / 100;
}

const fechaCorta = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Fecha de calendario legible: "20 de julio de 2026". Se interpreta en UTC
 * porque las fechas se guardan como medianoche en UTC, no como un instante con
 * zona; leerlas en Guatemala las correría al día anterior.
 */
export function formatearFecha(fecha: Date): string {
  return fechaCorta.format(fecha);
}

/** Rango de un turno tal como se lee: "06:45 a 09:00". */
export function formatearRangoTurno(horaInicio: Date, horaFin: Date): string {
  return `${aHoraDeReloj(horaInicio)} a ${aHoraDeReloj(horaFin)}`;
}

/** Descripción de un turno con su día: "Lunes, 06:45 a 09:00". */
export function describirTurno(diaSemana: DiaSemana, horaInicio: Date, horaFin: Date): string {
  return `${ETIQUETAS_DIA[diaSemana]}, ${formatearRangoTurno(horaInicio, horaFin)}`;
}

/**
 * Día de calendario "YYYY-MM-DD" como la medianoche en UTC con la que se guarda
 * una columna `date`. Igual que las horas beca, la fecha es un día del
 * calendario y no un instante con zona: así una fecha capturada de noche en
 * Guatemala no se corre al día siguiente.
 */
export function aFechaDeCalendario(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/**
 * Día de la semana de una fecha de calendario.
 *
 * Las fechas de este módulo son días de calendario guardados como medianoche en
 * UTC, no instantes, así que el día se lee en UTC. `diaSemanaDe` de tutorías no
 * sirve aquí: lee la zona de Guatemala, y como va seis horas detrás de UTC, la
 * medianoche del jueves cae el miércoles por la tarde y el día salía corrido
 * uno hacia atrás.
 */
export function diaSemanaDeFechaDeCalendario(fecha: Date): DiaSemana {
  // getUTCDay() devuelve 0 para domingo; DIAS_SEMANA empieza en lunes.
  const porIndice: readonly DiaSemana[] = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
  ];

  return porIndice[fecha.getUTCDay()] ?? "LUNES";
}

/** Nombre de un artículo con su talla: "Bata azul (M)" o "Lentes". */
export function describirArticulo(tipo: TipoArticuloBata, talla: TallaBata | null): string {
  return esBata(tipo) && talla
    ? `${ETIQUETAS_TIPO_ARTICULO[tipo]} (${talla})`
    : ETIQUETAS_TIPO_ARTICULO[tipo];
}
