import type { Prisma } from "@prisma/client";

import { normalizarTexto } from "@/lib/busqueda-texto";
import { NOMBRE_ASOCIACION_GENERAL } from "@/lib/inicio/consultas-inicio";
import { obtenerPrisma } from "@/lib/prisma";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

/** Organizaciones por página del listado público. Cuatro filas de tres en escritorio. */
export const ORGANIZACIONES_POR_PAGINA = 12;

export type RedSocialOrganizacion = {
  idRedSocial: number;
  plataforma: string;
  url: string;
};

export type IntegranteJunta = {
  idIntegrante: number;
  nombre: string;
  cargo: string;
  periodo: string;
  fotoUrl: string | null;
};

/** Lo que necesita la tarjeta de una organización, sea asociación o club. */
export type OrganizacionResumen = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
};

export type AsociacionDetalle = OrganizacionResumen & {
  mision: string | null;
  vision: string | null;
  correo: string | null;
  informacionContacto: string | null;
  integrantes: IntegranteJunta[];
  redesSociales: RedSocialOrganizacion[];
};

export type ClubDetalle = OrganizacionResumen & {
  actividades: string | null;
  correo: string | null;
  informacionContacto: string | null;
  redesSociales: RedSocialOrganizacion[];
};

export type PaginaOrganizaciones = {
  organizaciones: OrganizacionResumen[];
  total: number;
  pagina: number;
  paginas: number;
};

/** Fila del listado del panel. A diferencia del público incluye el estado. */
export type OrganizacionAdministrativa = OrganizacionResumen & {
  activo: boolean;
  eventosOrganizados: number;
};

export type PaginaOrganizacionesAdmin = {
  organizaciones: OrganizacionAdministrativa[];
  total: number;
  pagina: number;
  paginas: number;
};

const CAMPOS_RED_SOCIAL = { idRedSocial: true, plataforma: true, url: true } as const;

const CAMPOS_INTEGRANTE = {
  idIntegrante: true,
  nombre: true,
  cargo: true,
  periodo: true,
  fotoUrl: true,
} as const;

/**
 * Condición común de todo lo que ve el estudiantado: solo las organizaciones
 * activas existen fuera del panel administrativo. Dar de baja una asociación la
 * retira de las pantallas públicas sin borrar su historial de eventos.
 */
export function soloActivas(): { activo: true } {
  return { activo: true };
}

/**
 * La asociación general queda fuera del listado: tiene su propia página
 * institucional y aparecer dos veces confundiría al estudiantado.
 */
function sinAsociacionGeneral(): Prisma.AsociacionWhereInput {
  return { NOT: { nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" } } };
}

/** Traduce el buscador del listado a la condición sobre la copia normalizada. */
function condicionBusqueda(busqueda: string | undefined) {
  const texto = normalizarTexto(busqueda ?? "");
  return texto ? { textoBusqueda: { contains: texto } } : {};
}

function paginar(pagina: number | undefined, porPagina: number | undefined) {
  const tamano = porPagina ?? ORGANIZACIONES_POR_PAGINA;
  const numero = Math.max(1, Math.trunc(pagina ?? 1));

  return { tamano, numero, saltar: (numero - 1) * tamano };
}

export type OpcionesListado = {
  pagina?: number;
  porPagina?: number;
  busqueda?: string;
};

/** Asociaciones activas en orden alfabético, con su buscador y su paginación. */
export async function listarAsociaciones(
  opciones: OpcionesListado = {}
): Promise<PaginaOrganizaciones> {
  const { tamano, numero, saltar } = paginar(opciones.pagina, opciones.porPagina);
  const where: Prisma.AsociacionWhereInput = {
    ...soloActivas(),
    ...sinAsociacionGeneral(),
    ...condicionBusqueda(opciones.busqueda),
  };

  const prisma = obtenerPrisma();
  const [total, asociaciones] = await Promise.all([
    prisma.asociacion.count({ where }),
    prisma.asociacion.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: saltar,
      take: tamano,
      select: { idAsociacion: true, nombre: true, descripcion: true, imagenUrl: true },
    }),
  ]);

  return {
    organizaciones: asociaciones.map((asociacion) => ({
      id: asociacion.idAsociacion,
      nombre: asociacion.nombre,
      descripcion: asociacion.descripcion,
      imagenUrl: asociacion.imagenUrl,
    })),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / tamano)),
  };
}

/** Detalle de una asociación activa. Devuelve null si no existe o está de baja. */
export async function obtenerAsociacion(idAsociacion: number): Promise<AsociacionDetalle | null> {
  if (!Number.isSafeInteger(idAsociacion) || idAsociacion <= 0) return null;

  const asociacion = await obtenerPrisma().asociacion.findFirst({
    where: { idAsociacion, ...soloActivas() },
    select: {
      idAsociacion: true,
      nombre: true,
      descripcion: true,
      mision: true,
      vision: true,
      correo: true,
      informacionContacto: true,
      imagenUrl: true,
      integrantes: {
        where: { activo: true },
        // El orden lo decide AEUVG desde el panel: la junta se lee por jerarquía
        // de cargos y no en orden alfabético.
        orderBy: [{ ordenVisualizacion: "asc" }, { nombre: "asc" }],
        select: CAMPOS_INTEGRANTE,
      },
      redesSociales: {
        where: { activo: true },
        orderBy: { plataforma: "asc" },
        select: CAMPOS_RED_SOCIAL,
      },
    },
  });

  if (!asociacion) return null;

  return {
    id: asociacion.idAsociacion,
    nombre: asociacion.nombre,
    descripcion: asociacion.descripcion,
    mision: asociacion.mision,
    vision: asociacion.vision,
    correo: asociacion.correo,
    informacionContacto: asociacion.informacionContacto,
    imagenUrl: asociacion.imagenUrl,
    integrantes: asociacion.integrantes,
    redesSociales: asociacion.redesSociales,
  };
}

/** Indica si el identificador corresponde a la propia asociación general. */
export async function esAsociacionGeneral(idAsociacion: number): Promise<boolean> {
  if (!Number.isSafeInteger(idAsociacion) || idAsociacion <= 0) return false;

  const asociacion = await obtenerPrisma().asociacion.findFirst({
    where: { idAsociacion, nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" } },
    select: { idAsociacion: true },
  });

  return asociacion !== null;
}

/** Clubes activos en orden alfabético, con su buscador y su paginación. */
export async function listarClubes(opciones: OpcionesListado = {}): Promise<PaginaOrganizaciones> {
  const { tamano, numero, saltar } = paginar(opciones.pagina, opciones.porPagina);
  const where: Prisma.ClubWhereInput = {
    ...soloActivas(),
    ...condicionBusqueda(opciones.busqueda),
  };

  const prisma = obtenerPrisma();
  const [total, clubes] = await Promise.all([
    prisma.club.count({ where }),
    prisma.club.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: saltar,
      take: tamano,
      select: { idClub: true, nombre: true, descripcion: true, imagenUrl: true },
    }),
  ]);

  return {
    organizaciones: clubes.map((club) => ({
      id: club.idClub,
      nombre: club.nombre,
      descripcion: club.descripcion,
      imagenUrl: club.imagenUrl,
    })),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / tamano)),
  };
}

/**
 * Detalle de un club activo. Devuelve null si no existe o está de baja.
 *
 * Un club no tiene junta directiva registrada: el requerimiento de AEUVG
 * contempla ese dato solo para las asociaciones, por lo que su detalle presenta
 * las actividades habituales en el lugar que allí ocupan los integrantes.
 */
export async function obtenerClub(idClub: number): Promise<ClubDetalle | null> {
  if (!Number.isSafeInteger(idClub) || idClub <= 0) return null;

  const club = await obtenerPrisma().club.findFirst({
    where: { idClub, ...soloActivas() },
    select: {
      idClub: true,
      nombre: true,
      descripcion: true,
      actividades: true,
      correo: true,
      informacionContacto: true,
      imagenUrl: true,
      redesSociales: {
        where: { activo: true },
        orderBy: { plataforma: "asc" },
        select: CAMPOS_RED_SOCIAL,
      },
    },
  });

  if (!club) return null;

  return {
    id: club.idClub,
    nombre: club.nombre,
    descripcion: club.descripcion,
    actividades: club.actividades,
    correo: club.correo,
    informacionContacto: club.informacionContacto,
    imagenUrl: club.imagenUrl,
    redesSociales: club.redesSociales,
  };
}

/** Filas por página del listado del panel. */
export const ORGANIZACIONES_POR_PAGINA_ADMIN = 15;

/**
 * Listado del panel administrativo. A diferencia del público incluye los
 * registros dados de baja y la propia asociación general, porque AEUVG también
 * administra su ficha desde aquí, y reporta cuántos eventos organiza cada uno:
 * es el dato que decide si puede eliminarse o solo darse de baja.
 */
export async function listarOrganizacionesAdministracion(
  tipo: TipoOrganizacion,
  opciones: OpcionesListado = {}
): Promise<PaginaOrganizacionesAdmin> {
  const { tamano, numero, saltar } = paginar(
    opciones.pagina,
    opciones.porPagina ?? ORGANIZACIONES_POR_PAGINA_ADMIN
  );
  const where = condicionBusqueda(opciones.busqueda);
  const prisma = obtenerPrisma();

  if (tipo === "asociaciones") {
    const [total, filas] = await Promise.all([
      prisma.asociacion.count({ where }),
      prisma.asociacion.findMany({
        where,
        orderBy: { nombre: "asc" },
        skip: saltar,
        take: tamano,
        select: {
          idAsociacion: true,
          nombre: true,
          descripcion: true,
          imagenUrl: true,
          activo: true,
          _count: { select: { eventosOrganizados: true } },
        },
      }),
    ]);

    return {
      organizaciones: filas.map((fila) => ({
        id: fila.idAsociacion,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        imagenUrl: fila.imagenUrl,
        activo: fila.activo,
        eventosOrganizados: fila._count.eventosOrganizados,
      })),
      total,
      pagina: numero,
      paginas: Math.max(1, Math.ceil(total / tamano)),
    };
  }

  const [total, filas] = await Promise.all([
    prisma.club.count({ where }),
    prisma.club.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: saltar,
      take: tamano,
      select: {
        idClub: true,
        nombre: true,
        descripcion: true,
        imagenUrl: true,
        activo: true,
        _count: { select: { eventosOrganizados: true } },
      },
    }),
  ]);

  return {
    organizaciones: filas.map((fila) => ({
      id: fila.idClub,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      imagenUrl: fila.imagenUrl,
      activo: fila.activo,
      eventosOrganizados: fila._count.eventosOrganizados,
    })),
    total,
    pagina: numero,
    paginas: Math.max(1, Math.ceil(total / tamano)),
  };
}
