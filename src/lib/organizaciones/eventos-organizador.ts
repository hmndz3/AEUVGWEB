import type { Prisma } from "@prisma/client";

import { consultarEventosPublicados, type EventoResumen } from "@/lib/eventos/consultas-eventos";

/** Actividades que se muestran por bloque en la página de un organizador. */
export const ACTIVIDADES_POR_BLOQUE = 6;

export type Organizador = { tipo: "asociacion" | "club"; id: number };

export type ActividadesOrganizador = {
  proximas: EventoResumen[];
  pasadas: EventoResumen[];
};

/**
 * Condición de los eventos que organiza una asociación o un club. La tabla de
 * organizadores guarda una sola referencia por fila, así que basta con buscar la
 * que corresponda al tipo recibido.
 */
export function condicionOrganizador(organizador: Organizador): Prisma.EventoWhereInput {
  return organizador.tipo === "asociacion"
    ? { organizadores: { some: { idAsociacion: organizador.id } } }
    : { organizadores: { some: { idClub: organizador.id } } };
}

/**
 * Actividades publicadas de un organizador, separadas en próximas y pasadas.
 *
 * Se separan porque la página de una asociación responde a dos preguntas
 * distintas: a qué puedo asistir y qué ha hecho este grupo. Las próximas van de
 * la más cercana a la más lejana y las pasadas de la más reciente a la más
 * antigua, que es el orden en el que se leen.
 */
export async function obtenerActividadesDeOrganizador(
  organizador: Organizador,
  opciones: { limite?: number; ahora?: Date } = {}
): Promise<ActividadesOrganizador> {
  if (!Number.isSafeInteger(organizador.id) || organizador.id <= 0) {
    return { proximas: [], pasadas: [] };
  }

  const ahora = opciones.ahora ?? new Date();
  const limite = opciones.limite ?? ACTIVIDADES_POR_BLOQUE;
  const base = condicionOrganizador(organizador);

  const [proximas, pasadas] = await Promise.all([
    // Un evento sigue siendo próximo mientras no haya terminado, igual que en la
    // cartelera: una actividad de varios días no pasa a "pasadas" al empezar.
    consultarEventosPublicados({
      condiciones: { ...base, fechaFin: { gte: ahora } },
      orden: "asc",
      limite,
    }),
    consultarEventosPublicados({
      condiciones: { ...base, fechaFin: { lt: ahora } },
      orden: "desc",
      limite,
    }),
  ]);

  return { proximas, pasadas };
}
