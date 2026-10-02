import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type DatosAsociacionPersistidos = {
  nombre: string;
  descripcion: string | null;
  mision: string | null;
  vision: string | null;
  correo: string | null;
  informacionContacto: string | null;
  imagenUrl: string | null;
  textoBusqueda: string;
};

export type AsociacionAdministrada = DatosAsociacionPersistidos & {
  idAsociacion: number;
  activo: boolean;
};

export interface RepositorioOrganizaciones {
  /** Indica si el nombre está libre, sin contar el registro que se está editando. */
  nombreAsociacionDisponible(nombre: string, excepto: number | null): Promise<boolean>;
  crearAsociacion(datos: DatosAsociacionPersistidos): Promise<number>;
  actualizarAsociacion(idAsociacion: number, datos: DatosAsociacionPersistidos): Promise<boolean>;
  obtenerAsociacion(idAsociacion: number): Promise<AsociacionAdministrada | null>;
  cambiarEstadoAsociacion(idAsociacion: number, activo: boolean): Promise<boolean>;
  asociacionOrganizaEventos(idAsociacion: number): Promise<boolean>;
  eliminarAsociacion(idAsociacion: number): Promise<boolean>;
}

const seleccionAsociacion = {
  idAsociacion: true,
  nombre: true,
  descripcion: true,
  mision: true,
  vision: true,
  correo: true,
  informacionContacto: true,
  imagenUrl: true,
  textoBusqueda: true,
  activo: true,
} as const;

export class RepositorioOrganizacionesPrisma implements RepositorioOrganizaciones {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  /**
   * La restricción de la tabla distingue mayúsculas, así que la comprobación se
   * hace sin distinguirlas: "Club de Teatro" y "club de teatro" son el mismo
   * grupo para cualquiera que lea el listado.
   */
  async nombreAsociacionDisponible(nombre: string, excepto: number | null): Promise<boolean> {
    const existente = await this.prisma.asociacion.findFirst({
      where: {
        nombre: { equals: nombre, mode: "insensitive" },
        ...(excepto ? { idAsociacion: { not: excepto } } : {}),
      },
      select: { idAsociacion: true },
    });

    return existente === null;
  }

  async crearAsociacion(datos: DatosAsociacionPersistidos): Promise<number> {
    const asociacion = await this.prisma.asociacion.create({
      data: datos,
      select: { idAsociacion: true },
    });

    return asociacion.idAsociacion;
  }

  async actualizarAsociacion(
    idAsociacion: number,
    datos: DatosAsociacionPersistidos
  ): Promise<boolean> {
    const { count } = await this.prisma.asociacion.updateMany({
      where: { idAsociacion },
      data: datos,
    });

    return count > 0;
  }

  async obtenerAsociacion(idAsociacion: number): Promise<AsociacionAdministrada | null> {
    return this.prisma.asociacion.findUnique({
      where: { idAsociacion },
      select: seleccionAsociacion,
    });
  }

  async cambiarEstadoAsociacion(idAsociacion: number, activo: boolean): Promise<boolean> {
    const { count } = await this.prisma.asociacion.updateMany({
      where: { idAsociacion },
      data: { activo },
    });

    return count > 0;
  }

  async asociacionOrganizaEventos(idAsociacion: number): Promise<boolean> {
    const organizador = await this.prisma.organizadorEvento.findFirst({
      where: { idAsociacion },
      select: { idOrganizadorEvento: true },
    });

    return organizador !== null;
  }

  async eliminarAsociacion(idAsociacion: number): Promise<boolean> {
    const { count } = await this.prisma.asociacion.deleteMany({ where: { idAsociacion } });

    return count > 0;
  }
}
