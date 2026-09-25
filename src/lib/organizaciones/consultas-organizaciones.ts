import type { Prisma } from "@prisma/client";

import { normalizarTexto } from "@/lib/busqueda-texto";
import { NOMBRE_ASOCIACION_GENERAL } from "@/lib/inicio/consultas-inicio";
import { obtenerPrisma } from "@/lib/prisma";

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

export type PaginaOrganizaciones = {
  organizaciones: OrganizacionResumen[];
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
