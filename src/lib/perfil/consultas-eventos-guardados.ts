import { consultarEventosPublicados, type EventoResumen } from "@/lib/eventos/consultas-eventos";
import { crearServicioEventosGuardados } from "@/lib/perfil/crear-servicio-eventos-guardados";

/** Tope de eventos guardados que se presentan por bloque en el perfil. */
export const GUARDADOS_POR_BLOQUE = 12;

export type EventosGuardados = {
  proximos: EventoResumen[];
  pasados: EventoResumen[];
};

/**
 * Eventos guardados del estudiante, separados en próximos y ya finalizados.
 *
 * Reutiliza la consulta de eventos publicados del módulo de eventos, de modo que
 * un evento cancelado o eliminado desaparezca de la lista sin que el estudiante
 * tenga que quitarlo: lo que ya no está publicado no se devuelve.
 */
export async function obtenerEventosGuardados(
  idUsuario: number,
  opciones: { limite?: number; ahora?: Date } = {}
): Promise<EventosGuardados> {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) return { proximos: [], pasados: [] };

  const ahora = opciones.ahora ?? new Date();
  const limite = opciones.limite ?? GUARDADOS_POR_BLOQUE;
  const base = { guardados: { some: { idUsuario } } };

  const [proximos, pasados] = await Promise.all([
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

  return { proximos, pasados };
}

/** Cuáles de los eventos indicados tiene guardados el estudiante. */
export async function obtenerIdsGuardados(
  idUsuario: number,
  idsEventos: number[]
): Promise<Set<number>> {
  if (idsEventos.length === 0) return new Set();

  try {
    return await crearServicioEventosGuardados().idsGuardados(idUsuario, idsEventos);
  } catch {
    // La cartelera es la pantalla principal del sitio: si esta consulta falla, el
    // control de guardar se presenta sin marcar en lugar de tumbar el listado.
    return new Set();
  }
}
