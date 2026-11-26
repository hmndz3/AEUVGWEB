import { DIAS_SEMANA, ETIQUETAS_DIA } from "@/lib/tutorias/formato-tutorias";
import type { DiaSemana } from "@prisma/client";

/**
 * Cuadrícula semanal de los turnos de atención.
 *
 * Los turnos se guardan sueltos —un día y un rango de horas cada uno—, pero
 * quien los lee los espera como un horario: las horas en el costado y los días
 * arriba. Esta función reacomoda la lista en esa forma, sin tocar la base: saca
 * los bloques horarios distintos, los ordena por hora de inicio y deja a mano el
 * turno que cae en cada cruce de día y bloque.
 *
 * Los bloques no son iguales todos los días —entre semana se empieza a las
 * 6:45 y el sábado a las 7:00—, así que un bloque que solo existe un día deja
 * vacías las demás casillas de su fila. Es justo lo que pasa en el horario de
 * papel.
 */

/** Lo mínimo que la cuadrícula necesita de un turno para colocarlo. */
export type TurnoUbicable = {
  dia: DiaSemana;
  /** Hora de reloj de 24 horas, "06:45". */
  horaInicio: string;
  horaFin: string;
};

export type BloqueRejilla = {
  /** Identifica la fila: "06:45-09:00". */
  clave: string;
  horaInicio: string;
  horaFin: string;
  /** Cómo se lee el bloque: "06:45 a 09:00". */
  etiqueta: string;
};

export type ColumnaRejilla = {
  dia: DiaSemana;
  etiqueta: string;
  /** Nombre corto para el encabezado estrecho: "Mié". */
  abreviatura: string;
};

export type RejillaTurnos<T extends TurnoUbicable> = {
  columnas: ColumnaRejilla[];
  bloques: BloqueRejilla[];
  /** El turno de ese día a esa hora, o null si ese día no abre en ese bloque. */
  celda: (dia: DiaSemana, claveBloque: string) => T | null;
  /** Los turnos de un día, de la primera hora a la última. */
  turnosDe: (dia: DiaSemana) => T[];
};

const ABREVIATURAS: Record<DiaSemana, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

export function claveDeBloque(horaInicio: string, horaFin: string): string {
  return `${horaInicio}-${horaFin}`;
}

export function construirRejillaTurnos<T extends TurnoUbicable>(turnos: T[]): RejillaTurnos<T> {
  const bloquesPorClave = new Map<string, BloqueRejilla>();
  const porCasilla = new Map<string, T>();
  const diasConTurnos = new Set<DiaSemana>();

  for (const turno of turnos) {
    const clave = claveDeBloque(turno.horaInicio, turno.horaFin);

    if (!bloquesPorClave.has(clave)) {
      bloquesPorClave.set(clave, {
        clave,
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        etiqueta: `${turno.horaInicio} a ${turno.horaFin}`,
      });
    }

    diasConTurnos.add(turno.dia);
    // Dos turnos del mismo día a la misma hora no existen: la base lo impide
    // con una llave única de día, inicio y fin. Si llegaran, gana el primero.
    if (!porCasilla.has(`${turno.dia}|${clave}`)) porCasilla.set(`${turno.dia}|${clave}`, turno);
  }

  const bloques = [...bloquesPorClave.values()].sort(
    (a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.horaFin.localeCompare(b.horaFin)
  );

  const columnas: ColumnaRejilla[] = DIAS_SEMANA.filter((dia) => diasConTurnos.has(dia)).map(
    (dia) => ({ dia, etiqueta: ETIQUETAS_DIA[dia], abreviatura: ABREVIATURAS[dia] })
  );

  return {
    columnas,
    bloques,
    celda: (dia, claveBloque) => porCasilla.get(`${dia}|${claveBloque}`) ?? null,
    turnosDe: (dia) =>
      bloques
        .map((bloque) => porCasilla.get(`${dia}|${bloque.clave}`))
        .filter((turno): turno is T => turno !== undefined),
  };
}
