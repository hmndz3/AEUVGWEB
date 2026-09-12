import type { EstadoEvento, Prisma, TipoActividad } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Eventos por página del listado público. Tres filas de tres en escritorio. */
export const EVENTOS_POR_PAGINA = 9;

/** Tope duro de una consulta de rango, para que el calendario no pida todo. */
const MAXIMO_POR_RANGO = 300;

export type CategoriaResumen = {
  idCategoriaEvento: number;
  nombre: string;
  color: string | null;
};

export type EventoResumen = {
  idEvento: number;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion: string;
  imagenUrl: string | null;
  destacado: boolean;
  estado: EstadoEvento;
  tipoActividad: TipoActividad;
  categoria: CategoriaResumen;
  organizadores: string[];
};

export type EventoDetalle = EventoResumen & {
  descripcion: string;
  informacionAdicional: string | null;
  cupo: number | null;
};

export type PaginaEventos = {
  eventos: EventoResumen[];
  total: number;
  pagina: number;
  paginas: number;
};

const seleccionResumen = {
  idEvento: true,
  nombre: true,
  fechaInicio: true,
  fechaFin: true,
  ubicacion: true,
  imagenUrl: true,
  destacado: true,
  estado: true,
  tipoActividad: true,
  categoria: { select: { idCategoriaEvento: true, nombre: true, color: true } },
  organizadores: {
    select: {
      organizadorPrincipal: true,
      unidadUvg: true,
      asociacion: { select: { nombre: true } },
      club: { select: { nombre: true } },
    },
  },
} as const;

const seleccionDetalle = {
  ...seleccionResumen,
  descripcion: true,
  informacionAdicional: true,
  cupo: true,
} as const;

type EventoConsultado = Prisma.EventoGetPayload<{ select: typeof seleccionResumen }>;
type EventoDetalleConsultado = Prisma.EventoGetPayload<{ select: typeof seleccionDetalle }>;

function nombresOrganizadores(evento: EventoConsultado): string[] {
  return (
    evento.organizadores
      // El organizador principal encabeza la lista; el resto conserva su orden.
      .slice()
      .sort((a, b) => Number(b.organizadorPrincipal) - Number(a.organizadorPrincipal))
      .flatMap((organizador) => {
        const nombre =
          organizador.asociacion?.nombre ?? organizador.club?.nombre ?? organizador.unidadUvg;
        return nombre ? [nombre] : [];
      })
  );
}

function mapearResumen(evento: EventoConsultado): EventoResumen {
  return {
    idEvento: evento.idEvento,
    nombre: evento.nombre,
    fechaInicio: evento.fechaInicio,
    fechaFin: evento.fechaFin,
    ubicacion: evento.ubicacion,
    imagenUrl: evento.imagenUrl,
    destacado: evento.destacado,
    estado: evento.estado,
    tipoActividad: evento.tipoActividad,
    categoria: evento.categoria,
    organizadores: nombresOrganizadores(evento),
  };
}

function mapearDetalle(evento: EventoDetalleConsultado): EventoDetalle {
  return {
    ...mapearResumen(evento),
    descripcion: evento.descripcion,
    informacionAdicional: evento.informacionAdicional,
    cupo: evento.cupo,
  };
}

/**
 * Condición común de todo lo que ve el estudiantado: solo los eventos
 * publicados existen fuera del panel administrativo. Los borradores y los
 * cancelados no aparecen en ningún listado público ni en el calendario.
 */
export function soloPublicados(): Prisma.EventoWhereInput {
  return { estado: "PUBLICADO" };
}

/** Eventos publicados que todavía no han terminado, del más próximo al más lejano. */
export async function listarEventosPublicados(
  opciones: {
    pagina?: number;
    porPagina?: number;
    condiciones?: Prisma.EventoWhereInput;
    ahora?: Date;
  } = {}
): Promise<PaginaEventos> {
  const porPagina = opciones.porPagina ?? EVENTOS_POR_PAGINA;
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1));
  const ahora = opciones.ahora ?? new Date();

  const where: Prisma.EventoWhereInput = {
    ...soloPublicados(),
    // Un evento sigue siendo "próximo" mientras no haya terminado, para que
    // una actividad de varios días no desaparezca el día que empieza.
    fechaFin: { gte: ahora },
    ...opciones.condiciones,
  };

  const prisma = obtenerPrisma();
  const [total, eventos] = await Promise.all([
    prisma.evento.count({ where }),
    prisma.evento.findMany({
      where,
      orderBy: [{ fechaInicio: "asc" }, { idEvento: "asc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      select: seleccionResumen,
    }),
  ]);

  return {
    eventos: eventos.map(mapearResumen),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/** Detalle de un evento publicado. Devuelve null si no existe o no está publicado. */
export async function obtenerEventoPublicado(idEvento: number): Promise<EventoDetalle | null> {
  if (!Number.isSafeInteger(idEvento) || idEvento <= 0) return null;

  const evento = await obtenerPrisma().evento.findFirst({
    where: { idEvento, ...soloPublicados() },
    select: seleccionDetalle,
  });

  return evento ? mapearDetalle(evento) : null;
}

/**
 * Eventos publicados que se cruzan con el rango indicado. Se usa para el
 * calendario, por lo que incluye los que empezaron antes del rango y siguen
 * en curso dentro de él.
 */
export async function listarEventosEnRango(desde: Date, hasta: Date): Promise<EventoResumen[]> {
  if (desde.getTime() > hasta.getTime()) return [];

  const eventos = await obtenerPrisma().evento.findMany({
    where: {
      ...soloPublicados(),
      fechaInicio: { lte: hasta },
      fechaFin: { gte: desde },
    },
    orderBy: [{ fechaInicio: "asc" }, { idEvento: "asc" }],
    take: MAXIMO_POR_RANGO,
    select: seleccionResumen,
  });

  return eventos.map(mapearResumen);
}

/** Categorías activas, para las barras de filtros y el formulario del panel. */
export async function listarCategorias(): Promise<CategoriaResumen[]> {
  return obtenerPrisma().categoriaEvento.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { idCategoriaEvento: true, nombre: true, color: true },
  });
}

export type OrganizadoresDisponibles = {
  asociaciones: { id: number; nombre: string }[];
  clubes: { id: number; nombre: string }[];
};

/** Asociaciones y clubes activos que pueden organizar un evento. */
export async function listarOrganizadores(): Promise<OrganizadoresDisponibles> {
  const prisma = obtenerPrisma();
  const [asociaciones, clubes] = await Promise.all([
    prisma.asociacion.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { idAsociacion: true, nombre: true },
    }),
    prisma.club.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { idClub: true, nombre: true },
    }),
  ]);

  return {
    asociaciones: asociaciones.map((a) => ({ id: a.idAsociacion, nombre: a.nombre })),
    clubes: clubes.map((c) => ({ id: c.idClub, nombre: c.nombre })),
  };
}
