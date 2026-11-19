import {
  mapearResumen,
  seleccionResumen,
  type EventoResumen,
} from "@/lib/eventos/consultas-eventos";
import { obtenerPrisma } from "@/lib/prisma";
import { TIPOS_INTERES } from "@/lib/personalizacion/intereses";

/** Eventos que se recomiendan de una vez. Más abajo nadie mira. */
export const MAXIMO_RECOMENDACIONES = 6;

/** Categorías que la cuenta marcó como de su interés. */
export async function obtenerInteresesDeCategorias(idUsuario: number): Promise<number[]> {
  const intereses = await obtenerPrisma().interesUsuario.findMany({
    where: { idUsuario, tipoInteres: TIPOS_INTERES.categoriaEvento },
    select: { idReferencia: true },
  });

  return intereses.map(({ idReferencia }) => idReferencia);
}

/**
 * Reemplaza los intereses de categorías de la cuenta por los elegidos.
 *
 * Se borra y se vuelve a escribir en una transacción en lugar de comparar
 * contra lo guardado: la selección es pequeña y la comparación tendría que
 * resolver altas y bajas por separado, con más que salir mal y nada que ganar.
 */
export async function guardarInteresesDeCategorias(
  idUsuario: number,
  idsCategoria: readonly number[]
): Promise<number> {
  const prisma = obtenerPrisma();

  return prisma.$transaction(async (tx) => {
    await tx.interesUsuario.deleteMany({
      where: { idUsuario, tipoInteres: TIPOS_INTERES.categoriaEvento },
    });

    if (idsCategoria.length === 0) return 0;

    const { count } = await tx.interesUsuario.createMany({
      data: idsCategoria.map((idReferencia) => ({
        idUsuario,
        tipoInteres: TIPOS_INTERES.categoriaEvento,
        idReferencia,
        nivelInteres: 1,
      })),
    });

    return count;
  });
}

/**
 * Deja constancia de que alguien interactuó con algo.
 *
 * Nunca lanza: es un dato de apoyo para las recomendaciones, no la operación.
 * Si falla, el evento se guardó igual y hacer fallar la petición por el
 * registro sería peor que quedarse sin él.
 */
export async function registrarInteraccion(
  idUsuario: number,
  tipoEntidad: string,
  idEntidad: number,
  tipoInteraccion: string
): Promise<void> {
  try {
    await obtenerPrisma().interaccionUsuario.create({
      data: { idUsuario, tipoEntidad, idEntidad, tipoInteraccion },
    });
  } catch (error) {
    console.error(
      "No se pudo registrar una interacción:",
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Eventos recomendados para la cuenta.
 *
 * Son los próximos de las categorías que marcó, sin los que ya guardó: si ya
 * están en su lista, recomendárselos no le dice nada nuevo. Sin intereses
 * marcados no se recomienda nada, en lugar de caer a "los más próximos": eso
 * ya es la cartelera, y presentarlo como recomendación personal sería falso.
 */
export async function recomendarEventos(
  idUsuario: number,
  ahora = new Date()
): Promise<EventoResumen[]> {
  const categorias = await obtenerInteresesDeCategorias(idUsuario);
  if (categorias.length === 0) return [];

  const eventos = await obtenerPrisma().evento.findMany({
    where: {
      estado: "PUBLICADO",
      fechaFin: { gte: ahora },
      idCategoriaEvento: { in: categorias },
      // Los que ya guardó no se recomiendan: ya están en su lista.
      guardados: { none: { idUsuario } },
    },
    orderBy: [{ fechaInicio: "asc" }, { idEvento: "asc" }],
    take: MAXIMO_RECOMENDACIONES,
    select: seleccionResumen,
  });

  return eventos.map(mapearResumen);
}
