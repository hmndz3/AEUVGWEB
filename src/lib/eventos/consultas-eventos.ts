import type { EstadoEvento, Prisma, TipoActividad } from "@prisma/client";

import { nombreConSiglas, nombreCorto } from "@/lib/organizaciones/nombre-organizacion";
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

/**
 * Organizador de un evento tal como se presenta. El enlace apunta a la página
 * de la asociación o del club; una unidad de la universidad no tiene página
 * propia en la plataforma, así que viaja sin enlace y se pinta como texto.
 */
export type OrganizadorEnlace = {
  nombre: string;
  href: string | null;
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
  organizadores: OrganizadorEnlace[];
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
      asociacion: { select: { idAsociacion: true, nombre: true, siglas: true } },
      club: { select: { idClub: true, nombre: true } },
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

function enlacesOrganizadores(evento: EventoConsultado): OrganizadorEnlace[] {
  return (
    evento.organizadores
      // El organizador principal encabeza la lista; el resto conserva su orden.
      .slice()
      .sort((a, b) => Number(b.organizadorPrincipal) - Number(a.organizadorPrincipal))
      .flatMap((organizador): OrganizadorEnlace[] => {
        if (organizador.asociacion) {
          return [
            {
              // Las siglas, cuando existen, son como el estudiantado reconoce a
              // la asociación y caben en la tarjeta del evento.
              nombre: nombreCorto(organizador.asociacion),
              href: `/asociaciones/${organizador.asociacion.idAsociacion}`,
            },
          ];
        }
        if (organizador.club) {
          return [{ nombre: organizador.club.nombre, href: `/clubes/${organizador.club.idClub}` }];
        }

        return organizador.unidadUvg ? [{ nombre: organizador.unidadUvg, href: null }] : [];
      })
  );
}

/** Nombres de los organizadores, para los lugares donde no caben enlaces. */
export function nombresDeOrganizadores(organizadores: readonly OrganizadorEnlace[]): string[] {
  return organizadores.map((organizador) => organizador.nombre);
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
    organizadores: enlacesOrganizadores(evento),
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
 * Eventos publicados que cumplen las condiciones indicadas, con su orden y su
 * tope de resultados. Se usa cuando la ventana predeterminada del listado no
 * aplica, como en las actividades pasadas de una asociación o de un club, que
 * se leen de la más reciente a la más antigua.
 */
export async function consultarEventosPublicados(opciones: {
  condiciones?: Prisma.EventoWhereInput;
  orden?: "asc" | "desc";
  limite?: number;
}): Promise<EventoResumen[]> {
  const orden = opciones.orden ?? "asc";
  const eventos = await obtenerPrisma().evento.findMany({
    where: { ...soloPublicados(), ...opciones.condiciones },
    orderBy: [{ fechaInicio: orden }, { idEvento: orden }],
    take: Math.min(opciones.limite ?? EVENTOS_POR_PAGINA, MAXIMO_POR_RANGO),
    select: seleccionResumen,
  });

  return eventos.map(mapearResumen);
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

/**
 * Listado del panel administrativo. A diferencia del público, incluye los
 * borradores y los cancelados, y ordena del evento más reciente al más antiguo,
 * que es el orden en el que AEUVG trabaja sobre ellos.
 */
export async function listarEventosAdministracion(
  opciones: {
    pagina?: number;
    porPagina?: number;
    condiciones?: Prisma.EventoWhereInput;
  } = {}
): Promise<PaginaEventos> {
  const porPagina = opciones.porPagina ?? EVENTOS_POR_PAGINA;
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1));
  const where = opciones.condiciones ?? {};

  const prisma = obtenerPrisma();
  const [total, eventos] = await Promise.all([
    prisma.evento.count({ where }),
    prisma.evento.findMany({
      where,
      orderBy: [{ fechaInicio: "desc" }, { idEvento: "desc" }],
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
      select: { idAsociacion: true, nombre: true, siglas: true },
    }),
    prisma.club.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { idClub: true, nombre: true },
    }),
  ]);

  return {
    // En las listas de selección van las siglas junto al nombre completo: así
    // se encuentra la asociación tanto por una forma como por la otra. Se
    // reordena por esa etiqueta, que es la que se lee en la lista.
    asociaciones: asociaciones
      .map((a) => ({ id: a.idAsociacion, nombre: nombreConSiglas(a) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    clubes: clubes.map((c) => ({ id: c.idClub, nombre: c.nombre })),
  };
}
