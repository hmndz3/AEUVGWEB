import { obtenerPrisma } from "@/lib/prisma";

/** Nombre con el que la propia asociación general está registrada en el catálogo. */
export const NOMBRE_ASOCIACION_GENERAL = "AEUVG";

export type EventoResumen = {
  idEvento: number;
  nombre: string;
  fechaInicio: Date;
  ubicacion: string;
  destacado: boolean;
  categoria: { nombre: string; color: string | null };
  organizadores: string[];
};

export type RedSocialResumen = { plataforma: string; url: string };

type EventoConsultado = {
  idEvento: number;
  nombre: string;
  fechaInicio: Date;
  ubicacion: string;
  destacado: boolean;
  categoria: { nombre: string; color: string | null };
  organizadores: {
    unidadUvg: string | null;
    asociacion: { nombre: string } | null;
    club: { nombre: string } | null;
  }[];
};

function mapearEvento(evento: EventoConsultado): EventoResumen {
  return {
    idEvento: evento.idEvento,
    nombre: evento.nombre,
    fechaInicio: evento.fechaInicio,
    ubicacion: evento.ubicacion,
    destacado: evento.destacado,
    categoria: evento.categoria,
    organizadores: evento.organizadores.flatMap((organizador) => {
      const nombre =
        organizador.asociacion?.nombre ?? organizador.club?.nombre ?? organizador.unidadUvg;
      return nombre ? [nombre] : [];
    }),
  };
}

const seleccion = {
  idEvento: true,
  nombre: true,
  fechaInicio: true,
  ubicacion: true,
  destacado: true,
  categoria: { select: { nombre: true, color: true } },
  organizadores: {
    select: {
      unidadUvg: true,
      asociacion: { select: { nombre: true } },
      club: { select: { nombre: true } },
    },
  },
} as const;

/** Eventos publicados que aún no comienzan, del más próximo al más lejano. */
export async function obtenerProximosEventos(limite = 3, ahora = new Date()) {
  const eventos = await obtenerPrisma().evento.findMany({
    where: { estado: "PUBLICADO", fechaInicio: { gte: ahora } },
    orderBy: { fechaInicio: "asc" },
    take: limite,
    select: seleccion,
  });

  return eventos.map(mapearEvento);
}

/** Actividades marcadas como destacadas por AEUVG que todavía no terminan. */
export async function obtenerEventosDestacados(limite = 2, ahora = new Date()) {
  const eventos = await obtenerPrisma().evento.findMany({
    where: { estado: "PUBLICADO", destacado: true, fechaFin: { gte: ahora } },
    orderBy: { fechaInicio: "asc" },
    take: limite,
    select: seleccion,
  });

  return eventos.map(mapearEvento);
}

/** Redes sociales de la asociación general, para el bloque de contacto. */
export async function obtenerRedesAeuvg(): Promise<RedSocialResumen[]> {
  return obtenerPrisma().redSocial.findMany({
    where: {
      activo: true,
      asociacion: { nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" } },
    },
    orderBy: { plataforma: "asc" },
    select: { plataforma: true, url: true },
  });
}
