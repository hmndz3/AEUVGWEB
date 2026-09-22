import type { EstadoEvento, PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type OrganizadorNuevo = {
  idAsociacion: number | null;
  idClub: number | null;
  unidadUvg: string | null;
  organizadorPrincipal: boolean;
};

export type DatosEventoPersistidos = {
  nombre: string;
  descripcion: string;
  idCategoriaEvento: number;
  tipoActividad: "ACADEMICA" | "RECREATIVA" | "VOLUNTARIADO" | "OTRO";
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion: string;
  cupo: number | null;
  informacionAdicional: string | null;
  imagenUrl: string | null;
  destacado: boolean;
  textoBusqueda: string;
};

export type EventoAdministrado = {
  idEvento: number;
  nombre: string;
  descripcion: string;
  idCategoriaEvento: number;
  tipoActividad: "ACADEMICA" | "RECREATIVA" | "VOLUNTARIADO" | "OTRO";
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion: string;
  cupo: number | null;
  informacionAdicional: string | null;
  imagenUrl: string | null;
  destacado: boolean;
  estado: EstadoEvento;
  categoria: { nombre: string; color: string | null };
  organizadores: {
    idAsociacion: number | null;
    idClub: number | null;
    unidadUvg: string | null;
  }[];
};

export interface RepositorioEventos {
  categoriaActiva(idCategoriaEvento: number): Promise<boolean>;
  organizadoresExisten(idAsociacion: number | null, idClub: number | null): Promise<boolean>;
  crear(
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[],
    creadoPor: number
  ): Promise<number>;
  actualizar(
    idEvento: number,
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[]
  ): Promise<boolean>;
  cambiarEstado(idEvento: number, estado: EstadoEvento): Promise<boolean>;
  eliminar(idEvento: number): Promise<boolean>;
  obtener(idEvento: number): Promise<EventoAdministrado | null>;
}

const seleccion = {
  idEvento: true,
  nombre: true,
  descripcion: true,
  idCategoriaEvento: true,
  tipoActividad: true,
  fechaInicio: true,
  fechaFin: true,
  ubicacion: true,
  cupo: true,
  informacionAdicional: true,
  imagenUrl: true,
  destacado: true,
  estado: true,
  categoria: { select: { nombre: true, color: true } },
  organizadores: { select: { idAsociacion: true, idClub: true, unidadUvg: true } },
} as const;

export class RepositorioEventosPrisma implements RepositorioEventos {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async categoriaActiva(idCategoriaEvento: number): Promise<boolean> {
    const categoria = await this.prisma.categoriaEvento.findFirst({
      where: { idCategoriaEvento, activo: true },
      select: { idCategoriaEvento: true },
    });

    return categoria !== null;
  }

  async organizadoresExisten(idAsociacion: number | null, idClub: number | null): Promise<boolean> {
    const [asociacion, club] = await Promise.all([
      idAsociacion
        ? this.prisma.asociacion.findFirst({
            where: { idAsociacion, activo: true },
            select: { idAsociacion: true },
          })
        : Promise.resolve(null),
      idClub
        ? this.prisma.club.findFirst({ where: { idClub, activo: true }, select: { idClub: true } })
        : Promise.resolve(null),
    ]);

    return (!idAsociacion || asociacion !== null) && (!idClub || club !== null);
  }

  async crear(
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[],
    creadoPor: number
  ): Promise<number> {
    const evento = await this.prisma.evento.create({
      data: {
        ...datos,
        creadoPor,
        // Todo evento nace en borrador: publicarlo es una decisión aparte.
        estado: "BORRADOR",
        organizadores: { create: organizadores },
      },
      select: { idEvento: true },
    });

    return evento.idEvento;
  }

  async actualizar(
    idEvento: number,
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[]
  ): Promise<boolean> {
    const existente = await this.prisma.evento.findUnique({
      where: { idEvento },
      select: { idEvento: true },
    });

    if (!existente) return false;

    // Los organizadores se reemplazan en bloque dentro de la misma transacción:
    // son pocos por evento y así no queda un estado intermedio sin organizador.
    await this.prisma.$transaction([
      this.prisma.organizadorEvento.deleteMany({ where: { idEvento } }),
      this.prisma.evento.update({
        where: { idEvento },
        data: { ...datos, organizadores: { create: organizadores } },
      }),
    ]);

    return true;
  }

  async cambiarEstado(idEvento: number, estado: EstadoEvento): Promise<boolean> {
    const { count } = await this.prisma.evento.updateMany({
      where: { idEvento },
      data: { estado },
    });

    return count > 0;
  }

  async eliminar(idEvento: number): Promise<boolean> {
    const { count } = await this.prisma.evento.deleteMany({ where: { idEvento } });

    return count > 0;
  }

  async obtener(idEvento: number): Promise<EventoAdministrado | null> {
    return this.prisma.evento.findUnique({ where: { idEvento }, select: seleccion });
  }
}
