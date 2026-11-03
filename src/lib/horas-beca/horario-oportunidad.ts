/**
 * Horas de reloj de una oportunidad.
 *
 * Las columnas son `time(0)`: una hora del día sin fecha ni zona. Prisma las
 * entrega y las recibe como `Date` sobre el 1 de enero de 1970, así que la
 * conversión se hace en UTC. Interpretarlas en la zona del país las correría
 * seis horas, y una convocatoria de las 14:00 se leería a las 08:00.
 */
const DIA_DE_REFERENCIA = "1970-01-01";

/** Hora de reloj de 24 horas, tal como la escribe un campo de hora. */
export const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Hora de reloj en el formato que guarda la base, a partir de "HH:MM". */
export function aHoraDeBase(hora: string): Date {
  return new Date(`${DIA_DE_REFERENCIA}T${hora}:00.000Z`);
}

/** Hora de reloj como "HH:MM", a partir de lo que entrega la base. */
export function aHoraDeReloj(fecha: Date): string {
  const horas = String(fecha.getUTCHours()).padStart(2, "0");
  const minutos = String(fecha.getUTCMinutes()).padStart(2, "0");

  return `${horas}:${minutos}`;
}

/** Horario de la convocatoria tal como se presenta: "14:00 a 16:00". */
export function formatearHorarioOportunidad(inicio: string, fin: string): string {
  return `${inicio} a ${fin}`;
}
