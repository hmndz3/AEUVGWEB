import { listarEventosPublicados, type EventoResumen } from "@/lib/eventos/consultas-eventos";
import { obtenerPrisma } from "@/lib/prisma";

/** Nombre con el que la propia asociación general está registrada en el catálogo. */
export const NOMBRE_ASOCIACION_GENERAL = "AEUVG";

export type { EventoResumen };

export type RedSocialResumen = { plataforma: string; url: string };

/**
 * Ejecuta una consulta de portada tolerando fallos de la base. La portada es
 * pública y debe seguir sirviéndose aunque una sección no pueda cargarse.
 */
async function consultarOVacio<T>(consulta: () => Promise<T[]>): Promise<T[]> {
  try {
    return await consulta();
  } catch {
    return [];
  }
}

/**
 * Eventos publicados que aún no terminan, del más próximo al más lejano.
 *
 * La portada usa las mismas consultas que la cartelera desde el Sprint 2, para
 * que un evento se vea igual y con el mismo criterio en los dos lugares.
 */
export async function obtenerProximosEventos(limite = 3, ahora = new Date()) {
  const [pagina] = await consultarOVacio(async () => [
    await listarEventosPublicados({ porPagina: limite, ahora }),
  ]);

  return pagina?.eventos ?? [];
}

/** Actividades marcadas como destacadas por AEUVG que todavía no terminan. */
export async function obtenerEventosDestacados(limite = 2, ahora = new Date()) {
  const [pagina] = await consultarOVacio(async () => [
    await listarEventosPublicados({
      porPagina: limite,
      condiciones: { destacado: true },
      ahora,
    }),
  ]);

  return pagina?.eventos ?? [];
}

/** Vagones del tren de la portada: suficientes para que la pista se vea llena. */
export const EVENTOS_EN_TREN = 10;

/**
 * Elige los eventos del tren de la portada. Los destacados por AEUVG tienen
 * prioridad y el resto de los lugares se completa con los más próximos; el tren
 * los presenta en orden de fecha, que es como se lee una cartelera.
 */
export function elegirEventosTren(
  destacados: readonly EventoResumen[],
  proximos: readonly EventoResumen[],
  limite = EVENTOS_EN_TREN
): EventoResumen[] {
  const vistos = new Set<number>();

  return [...destacados, ...proximos]
    .filter((evento) => {
      if (vistos.has(evento.idEvento)) return false;
      vistos.add(evento.idEvento);
      return true;
    })
    .slice(0, limite)
    .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime() || a.idEvento - b.idEvento);
}

/** Eventos del tren de la portada, ya elegidos y ordenados. */
export async function obtenerEventosTren(limite = EVENTOS_EN_TREN, ahora = new Date()) {
  const [destacados, proximos] = await Promise.all([
    obtenerEventosDestacados(limite, ahora),
    obtenerProximosEventos(limite, ahora),
  ]);

  return elegirEventosTren(destacados, proximos, limite);
}

/** Redes sociales de la asociación general, para el bloque de contacto. */
export async function obtenerRedesAeuvg(): Promise<RedSocialResumen[]> {
  return consultarOVacio(() =>
    obtenerPrisma().redSocial.findMany({
      where: {
        activo: true,
        asociacion: { nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" } },
      },
      orderBy: { plataforma: "asc" },
      select: { plataforma: true, url: true },
    })
  );
}
