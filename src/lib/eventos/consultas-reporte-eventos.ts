import type { EventoReporte } from "@/lib/eventos/metricas-eventos";
import { obtenerPrisma } from "@/lib/prisma";
import {
  interpretarOrganizador,
  NOMBRE_AEUVG,
  type FiltrosEventosReporte,
} from "@/validators/reporte-eventos";
import type { Prisma } from "@prisma/client";

/**
 * Datos del reporte de eventos.
 *
 * Los eventos del campus son cientos, no millones, así que el reporte los trae
 * y hace las cuentas en memoria en lugar de pedirle a la base una consulta por
 * cada desglose. A cambio, los cálculos quedan en un módulo que se puede probar
 * sin base de datos (ver metricas-eventos.ts).
 */

/** Eventos que admite un reporte. Pasado ese punto hay que acotar el periodo. */
export const MAXIMO_EVENTOS_REPORTE = 5000;

/**
 * Guatemala no cambia de hora, así que el día se ancla con su desfase fijo.
 * Sin él, un evento de las 7 de la noche del 31 caería en el mes siguiente.
 */
const DESFASE_GUATEMALA = "-06:00";

function inicioDelDia(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000${DESFASE_GUATEMALA}`);
}

function finDelDia(fecha: string): Date {
  return new Date(`${fecha}T23:59:59.999${DESFASE_GUATEMALA}`);
}

/**
 * Traduce los filtros a la condición de la consulta.
 *
 * Recibe el identificador de AEUVG en lugar de buscarlo: así la función no
 * toca la base y se puede probar sola. Cuando AEUVG todavía no está en el
 * catálogo de asociaciones, el filtro no devuelve eventos en vez de devolver
 * todos, que sería lo contrario de lo que se pidió.
 */
export function construirDondeEventos(
  filtros: FiltrosEventosReporte,
  idAeuvg: number | null
): Prisma.EventoWhereInput {
  const donde: Prisma.EventoWhereInput = {};

  if (filtros.desde || filtros.hasta) {
    donde.fechaInicio = {
      ...(filtros.desde ? { gte: inicioDelDia(filtros.desde) } : {}),
      ...(filtros.hasta ? { lte: finDelDia(filtros.hasta) } : {}),
    };
  }

  if (filtros.categoria) donde.idCategoriaEvento = filtros.categoria;
  if (filtros.tipo) donde.tipoActividad = filtros.tipo;
  if (filtros.estado) donde.estado = filtros.estado;

  const organizador = interpretarOrganizador(filtros.organizador);

  if (organizador?.tipo === "aeuvg") {
    donde.organizadores = { some: { idAsociacion: idAeuvg ?? -1 } };
  } else if (organizador?.tipo === "asociacion") {
    donde.organizadores = { some: { idAsociacion: organizador.id } };
  } else if (organizador?.tipo === "club") {
    donde.organizadores = { some: { idClub: organizador.id } };
  }

  return donde;
}

/** Identificador de la asociación AEUVG, o null si todavía no está cargada. */
export async function obtenerIdAeuvg(): Promise<number | null> {
  const asociacion = await obtenerPrisma().asociacion.findFirst({
    where: {
      OR: [
        { siglas: { equals: NOMBRE_AEUVG, mode: "insensitive" } },
        { nombre: { equals: NOMBRE_AEUVG, mode: "insensitive" } },
      ],
    },
    select: { idAsociacion: true },
  });

  return asociacion?.idAsociacion ?? null;
}

export type CatalogosReporteEventos = {
  categorias: { id: number; nombre: string }[];
  asociaciones: { id: number; nombre: string }[];
  clubes: { id: number; nombre: string }[];
  /** False cuando AEUVG todavía no está en el catálogo de asociaciones. */
  hayAeuvg: boolean;
};

/** Listas con las que se arman los menús de los filtros. */
export async function obtenerCatalogosReporteEventos(): Promise<CatalogosReporteEventos> {
  const prisma = obtenerPrisma();

  const [categorias, asociaciones, clubes, idAeuvg] = await Promise.all([
    prisma.categoriaEvento.findMany({
      orderBy: { nombre: "asc" },
      select: { idCategoriaEvento: true, nombre: true },
    }),
    prisma.asociacion.findMany({
      orderBy: { nombre: "asc" },
      select: { idAsociacion: true, nombre: true, siglas: true },
    }),
    prisma.club.findMany({ orderBy: { nombre: "asc" }, select: { idClub: true, nombre: true } }),
    obtenerIdAeuvg(),
  ]);

  return {
    categorias: categorias.map((c) => ({ id: c.idCategoriaEvento, nombre: c.nombre })),
    asociaciones: asociaciones
      .filter((a) => a.idAsociacion !== idAeuvg)
      .map((a) => ({
        id: a.idAsociacion,
        nombre: a.siglas ? `${a.nombre} (${a.siglas})` : a.nombre,
      })),
    clubes: clubes.map((c) => ({ id: c.idClub, nombre: c.nombre })),
    hayAeuvg: idAeuvg !== null,
  };
}

export type ResultadoEventosReporte =
  | { tipo: "listo"; eventos: EventoReporte[] }
  | { tipo: "demasiados"; total: number; maximo: number };

/**
 * Eventos que entran en el reporte, con su interés y sus horas beca.
 *
 * Las horas no se leen evento por evento: se piden agrupadas en una sola
 * consulta y después se reparten, para no lanzar una consulta por fila.
 */
export async function obtenerEventosDelReporte(
  filtros: FiltrosEventosReporte = {}
): Promise<ResultadoEventosReporte> {
  const prisma = obtenerPrisma();
  const donde = construirDondeEventos(filtros, await obtenerIdAeuvg());

  const total = await prisma.evento.count({ where: donde });
  if (total > MAXIMO_EVENTOS_REPORTE) {
    return { tipo: "demasiados", total, maximo: MAXIMO_EVENTOS_REPORTE };
  }

  const eventos = await prisma.evento.findMany({
    where: donde,
    orderBy: [{ fechaInicio: "desc" }, { idEvento: "desc" }],
    take: MAXIMO_EVENTOS_REPORTE,
    select: {
      idEvento: true,
      nombre: true,
      descripcion: true,
      fechaInicio: true,
      fechaFin: true,
      ubicacion: true,
      tipoActividad: true,
      estado: true,
      cupo: true,
      informacionAdicional: true,
      categoria: { select: { nombre: true } },
      _count: { select: { guardados: true } },
      organizadores: {
        orderBy: { organizadorPrincipal: "desc" },
        select: {
          unidadUvg: true,
          asociacion: { select: { nombre: true, siglas: true } },
          club: { select: { nombre: true } },
        },
      },
    },
  });

  const horas = await prisma.registroHoraBeca.groupBy({
    by: ["idEvento"],
    where: { idEvento: { in: eventos.map((evento) => evento.idEvento) } },
    _sum: { cantidadHoras: true },
    _count: { _all: true },
  });

  const porEvento = new Map(
    horas.map((fila) => [
      fila.idEvento,
      { horas: Number(fila._sum.cantidadHoras ?? 0), apoyos: fila._count._all },
    ])
  );

  return {
    tipo: "listo",
    eventos: eventos.map((evento) => {
      const beca = porEvento.get(evento.idEvento);

      return {
        idEvento: evento.idEvento,
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        fechaInicio: evento.fechaInicio,
        fechaFin: evento.fechaFin,
        ubicacion: evento.ubicacion,
        categoria: evento.categoria.nombre,
        tipoActividad: evento.tipoActividad,
        estado: evento.estado,
        cupo: evento.cupo,
        informacionAdicional: evento.informacionAdicional,
        organizadores: evento.organizadores.map(nombreDeOrganizador).filter((n) => n !== ""),
        guardados: evento._count.guardados,
        horasBeca: beca?.horas ?? 0,
        apoyos: beca?.apoyos ?? 0,
      };
    }),
  };
}

function nombreDeOrganizador(organizador: {
  unidadUvg: string | null;
  asociacion: { nombre: string; siglas: string | null } | null;
  club: { nombre: string } | null;
}): string {
  if (organizador.asociacion) return organizador.asociacion.nombre;
  if (organizador.club) return organizador.club.nombre;

  return organizador.unidadUvg ?? "";
}
