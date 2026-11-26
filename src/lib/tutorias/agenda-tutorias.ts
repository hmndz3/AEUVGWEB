import { diaSemanaDe } from "@/lib/tutorias/formato-tutorias";

/**
 * Guatemala no cambia de hora en todo el año, así que su desplazamiento es
 * siempre el mismo. Un día de calendario y una hora de reloj se convierten en
 * un instante sumándoselo: sin el desplazamiento, una tutoría de las 14:00 se
 * guardaría como las 14:00 UTC, es decir, las 08:00 del país.
 */
export const DESPLAZAMIENTO_GUATEMALA = "-06:00";

/** Instante que corresponde a un día de calendario y una hora de reloj del país. */
export function instanteEnGuatemala(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00.000${DESPLAZAMIENTO_GUATEMALA}`);
}

/** Una franja de disponibilidad, reducida a lo que la comparación necesita. */
export type FranjaDisponible = {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  modalidad: string;
  /** Lugar o enlace que el tutor publicó para esa franja. */
  ubicacionEnlace: string | null;
};

/** Día de la semana de cada franja en la convención de JavaScript, con domingo en 0. */
export const NUMERO_DE_DIA: Record<string, number> = {
  DOMINGO: 0,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
};

/**
 * Día de la semana de una fecha "YYYY-MM-DD", en la convención de JavaScript.
 *
 * Se arma en UTC a partir de sus tres números y no con `new Date(iso)`: la
 * fecha es un día de calendario, no un instante, y dejar que cada navegador la
 * interprete en su propia zona la corre un día en medio mundo.
 */
export function numeroDeDiaDeIso(iso: string): number | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) return null;

  const [anio, mes, dia] = partes.slice(1).map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  // Una fecha imposible, como el 31 de febrero, se desborda al mes siguiente.
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;

  return fecha.getUTCDay();
}

/**
 * Las franjas del tutor que caen en el día de la semana de esa fecha.
 *
 * Genérica para devolver las franjas tal como entraron: quien las usa en la
 * pantalla necesita además su identificador y su modalidad tipada.
 */
export function franjasDelDia<T extends FranjaDisponible>(franjas: readonly T[], iso: string): T[] {
  const dia = numeroDeDiaDeIso(iso);
  if (dia === null) return [];

  return franjas.filter((franja) => NUMERO_DE_DIA[franja.diaSemana] === dia);
}

/**
 * La franja que contiene entero el rango pedido.
 *
 * Es la versión para el formulario de `franjaQueCubre`: trabaja sobre el día
 * de calendario que se eligió en el calendario, sin convertirlo a instante.
 */
export function franjaDelRango<T extends FranjaDisponible>(
  franjas: readonly T[],
  iso: string,
  horaInicio: string,
  horaFin: string
): T | null {
  if (!horaInicio || !horaFin || horaFin <= horaInicio) return null;

  return (
    franjasDelDia(franjas, iso).find(
      (franja) => franja.horaInicio <= horaInicio && franja.horaFin >= horaFin
    ) ?? null
  );
}

/**
 * Comprueba que la hora pedida caiga dentro de alguna franja del tutor.
 *
 * Se compara contra el día de la semana de la fecha pedida, no contra la fecha:
 * la disponibilidad se publica por día de la semana y se repite cada semana. La
 * franja tiene que contener el rango completo, no solo tocarlo, para que nadie
 * agende media tutoría fuera del horario del tutor.
 */
export function franjaQueCubre(
  franjas: readonly FranjaDisponible[],
  fecha: Date,
  horaInicio: string,
  horaFin: string
): FranjaDisponible | null {
  const dia = diaSemanaDe(fecha);

  return (
    franjas.find(
      (franja) =>
        franja.diaSemana === dia && franja.horaInicio <= horaInicio && franja.horaFin >= horaFin
    ) ?? null
  );
}

/**
 * La modalidad pedida tiene que caber en la que ofrece la franja.
 *
 * Una franja "AMBAS" admite las dos; una presencial no admite una virtual, y al
 * revés. Pedir "AMBAS" como estudiante no significa nada —hay que presentarse
 * de una forma o de la otra—, así que no se acepta.
 */
export function modalidadCompatible(ofrecida: string, pedida: string): boolean {
  if (pedida === "AMBAS") return false;

  return ofrecida === "AMBAS" || ofrecida === pedida;
}

/** Dos tutorías chocan si una empieza antes de que la otra termine. */
export function seTraslapan(
  una: { inicio: Date; fin: Date },
  otra: { inicio: Date; fin: Date }
): boolean {
  return una.inicio < otra.fin && otra.inicio < una.fin;
}
