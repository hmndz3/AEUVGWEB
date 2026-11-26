import type {
  DiaSemana,
  EstadoPostulacion,
  EstadoTutor,
  EstadoTutoria,
  ModalidadTutoria,
} from "@prisma/client";

/**
 * Horas de reloj de la disponibilidad.
 *
 * `disponibilidad_tutor` guarda las horas como `time(0)`: una hora del día sin
 * fecha ni zona. Prisma las entrega y las recibe como `Date` sobre el 1 de
 * enero de 1970, así que la conversión se hace en UTC. Interpretarlas en la
 * zona del país las correría seis horas, y un horario de las 14:00 se leería a
 * las 08:00.
 */
const DIA_DE_REFERENCIA = "1970-01-01";

/** Hora de reloj de 24 horas, tal como la escribe un campo de hora. */
export const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function aHoraDeBase(hora: string): Date {
  return new Date(`${DIA_DE_REFERENCIA}T${hora}:00.000Z`);
}

export function aHoraDeReloj(fecha: Date): string {
  const horas = String(fecha.getUTCHours()).padStart(2, "0");
  const minutos = String(fecha.getUTCMinutes()).padStart(2, "0");

  return `${horas}:${minutos}`;
}

/** Días de la semana en el orden en que se presentan y se recorren. */
export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
] as const satisfies readonly DiaSemana[];

export const ETIQUETAS_DIA: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

/** Día de la semana de una fecha, en la zona de Guatemala. */
export function diaSemanaDe(fecha: Date): DiaSemana {
  // getUTCDay() devuelve 0 para domingo; DIAS_SEMANA empieza en lunes.
  const clave = new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    timeZone: "America/Guatemala",
  }).format(fecha);

  const porClave: Record<string, DiaSemana> = {
    Mon: "LUNES",
    Tue: "MARTES",
    Wed: "MIERCOLES",
    Thu: "JUEVES",
    Fri: "VIERNES",
    Sat: "SABADO",
    Sun: "DOMINGO",
  };

  return porClave[clave] ?? "LUNES";
}

export const MODALIDADES = [
  "PRESENCIAL",
  "VIRTUAL",
  "AMBAS",
] as const satisfies readonly ModalidadTutoria[];

export const ETIQUETAS_MODALIDAD: Record<ModalidadTutoria, string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  AMBAS: "Presencial o virtual",
};

export const ESTADOS_POSTULACION = [
  "PENDIENTE",
  "APROBADA",
  "RECHAZADA",
] as const satisfies readonly EstadoPostulacion[];

export const ETIQUETAS_ESTADO_POSTULACION: Record<EstadoPostulacion, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const ESTADOS_TUTOR = [
  "ACTIVO",
  "INACTIVO",
  "SUSPENDIDO",
] as const satisfies readonly EstadoTutor[];

export const ETIQUETAS_ESTADO_TUTOR: Record<EstadoTutor, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
};

export const ETIQUETAS_ESTADO_TUTORIA: Record<EstadoTutoria, string> = {
  PROGRAMADA: "Por responder",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

/** Horario de una disponibilidad tal como se presenta: "14:00 a 16:00". */
export function formatearRangoHoras(inicio: string, fin: string): string {
  return `${inicio} a ${fin}`;
}

const fechaHoraTutoria = new Intl.DateTimeFormat("es-GT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guatemala",
});

/** Fecha y hora de una tutoría, que sí es un instante, en la hora del país. */
export function formatearFechaTutoria(fecha: Date): string {
  return fechaHoraTutoria.format(fecha);
}
