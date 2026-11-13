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
