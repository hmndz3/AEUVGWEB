import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";
import type {
  DatosIntegranteAdmin,
  DatosRedSocialAdmin,
  TipoOrganizacion,
} from "@/validators/organizacion-admin";

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

export type DatosClubPersistidos = {
  nombre: string;
  descripcion: string | null;
  actividades: string | null;
  correo: string | null;
  informacionContacto: string | null;
  imagenUrl: string | null;
  textoBusqueda: string;
};

/**
 * Ficha administrada tal como la lee el panel. Las dos entidades se presentan
 * con la misma forma, con sus campos propios opcionales, para que el formulario
 * y el listado no necesiten dos caminos distintos.
 */
export type IntegranteAdministrado = {
  idIntegrante: number;
  nombre: string;
  cargo: string;
  periodo: string;
  fotoUrl: string | null;
  ordenVisualizacion: number;
  activo: boolean;
};

export type RedSocialAdministrada = {
  idRedSocial: number;
  plataforma: string;
  url: string;
};

export type OrganizacionAdministrada = {
  id: number;
  nombre: string;
  descripcion: string | null;
  mision: string | null;
  vision: string | null;
  actividades: string | null;
  correo: string | null;
  informacionContacto: string | null;
  imagenUrl: string | null;
  activo: boolean;
};

export interface RepositorioOrganizaciones {
  /** Indica si el nombre está libre, sin contar el registro que se está editando. */
  nombreDisponible(
    tipo: TipoOrganizacion,
    nombre: string,
    excepto: number | null
  ): Promise<boolean>;
  crearAsociacion(datos: DatosAsociacionPersistidos): Promise<number>;
  crearClub(datos: DatosClubPersistidos): Promise<number>;
  actualizarAsociacion(idAsociacion: number, datos: DatosAsociacionPersistidos): Promise<boolean>;
  actualizarClub(idClub: number, datos: DatosClubPersistidos): Promise<boolean>;
  obtener(tipo: TipoOrganizacion, id: number): Promise<OrganizacionAdministrada | null>;
  cambiarEstado(tipo: TipoOrganizacion, id: number, activo: boolean): Promise<boolean>;
  organizaEventos(tipo: TipoOrganizacion, id: number): Promise<boolean>;
  eliminar(tipo: TipoOrganizacion, id: number): Promise<boolean>;

  crearIntegrante(idAsociacion: number, datos: DatosIntegranteAdmin): Promise<number>;
  actualizarIntegrante(
    idAsociacion: number,
    idIntegrante: number,
    datos: DatosIntegranteAdmin
  ): Promise<boolean>;
  eliminarIntegrante(idAsociacion: number, idIntegrante: number): Promise<boolean>;
  listarIntegrantes(idAsociacion: number): Promise<IntegranteAdministrado[]>;

  redSocialRegistrada(
    tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<boolean>;
  crearRedSocial(tipo: TipoOrganizacion, id: number, datos: DatosRedSocialAdmin): Promise<number>;
  eliminarRedSocial(tipo: TipoOrganizacion, id: number, idRedSocial: number): Promise<boolean>;
  listarRedesSociales(tipo: TipoOrganizacion, id: number): Promise<RedSocialAdministrada[]>;
}

const SELECCION_ASOCIACION = {
  idAsociacion: true,
  nombre: true,
  descripcion: true,
  mision: true,
  vision: true,
  correo: true,
  informacionContacto: true,
  imagenUrl: true,
  activo: true,
} as const;

const SELECCION_CLUB = {
  idClub: true,
  nombre: true,
  descripcion: true,
  actividades: true,
  correo: true,
  informacionContacto: true,
  imagenUrl: true,
  activo: true,
} as const;

export class RepositorioOrganizacionesPrisma implements RepositorioOrganizaciones {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  /**
   * La restricción de la tabla distingue mayúsculas, así que la comprobación se
   * hace sin distinguirlas: "Club de Teatro" y "club de teatro" son el mismo
   * grupo para cualquiera que lea el listado.
   */
  async nombreDisponible(
    tipo: TipoOrganizacion,
    nombre: string,
    excepto: number | null
  ): Promise<boolean> {
    const donde = { nombre: { equals: nombre, mode: "insensitive" as const } };

    const existente =
      tipo === "asociaciones"
        ? await this.prisma.asociacion.findFirst({
            where: { ...donde, ...(excepto ? { idAsociacion: { not: excepto } } : {}) },
            select: { idAsociacion: true },
          })
        : await this.prisma.club.findFirst({
            where: { ...donde, ...(excepto ? { idClub: { not: excepto } } : {}) },
            select: { idClub: true },
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

  async crearClub(datos: DatosClubPersistidos): Promise<number> {
    const club = await this.prisma.club.create({ data: datos, select: { idClub: true } });

    return club.idClub;
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

  async actualizarClub(idClub: number, datos: DatosClubPersistidos): Promise<boolean> {
    const { count } = await this.prisma.club.updateMany({ where: { idClub }, data: datos });

    return count > 0;
  }

  async obtener(tipo: TipoOrganizacion, id: number): Promise<OrganizacionAdministrada | null> {
    if (tipo === "asociaciones") {
      const asociacion = await this.prisma.asociacion.findUnique({
        where: { idAsociacion: id },
        select: SELECCION_ASOCIACION,
      });

      return asociacion ? { ...asociacion, id: asociacion.idAsociacion, actividades: null } : null;
    }

    const club = await this.prisma.club.findUnique({
      where: { idClub: id },
      select: SELECCION_CLUB,
    });

    return club ? { ...club, id: club.idClub, mision: null, vision: null } : null;
  }

  async cambiarEstado(tipo: TipoOrganizacion, id: number, activo: boolean): Promise<boolean> {
    const { count } =
      tipo === "asociaciones"
        ? await this.prisma.asociacion.updateMany({ where: { idAsociacion: id }, data: { activo } })
        : await this.prisma.club.updateMany({ where: { idClub: id }, data: { activo } });

    return count > 0;
  }

  async organizaEventos(tipo: TipoOrganizacion, id: number): Promise<boolean> {
    const organizador = await this.prisma.organizadorEvento.findFirst({
      where: tipo === "asociaciones" ? { idAsociacion: id } : { idClub: id },
      select: { idOrganizadorEvento: true },
    });

    return organizador !== null;
  }

  async eliminar(tipo: TipoOrganizacion, id: number): Promise<boolean> {
    const { count } =
      tipo === "asociaciones"
        ? await this.prisma.asociacion.deleteMany({ where: { idAsociacion: id } })
        : await this.prisma.club.deleteMany({ where: { idClub: id } });

    return count > 0;
  }

  async crearIntegrante(idAsociacion: number, datos: DatosIntegranteAdmin): Promise<number> {
    const integrante = await this.prisma.integranteAsociacion.create({
      data: { ...datos, idAsociacion },
      select: { idIntegrante: true },
    });

    return integrante.idIntegrante;
  }

  /**
   * La asociación viaja en la condición además del identificador del integrante:
   * así una dirección manipulada no puede editar al integrante de otra ficha.
   */
  async actualizarIntegrante(
    idAsociacion: number,
    idIntegrante: number,
    datos: DatosIntegranteAdmin
  ): Promise<boolean> {
    const { count } = await this.prisma.integranteAsociacion.updateMany({
      where: { idIntegrante, idAsociacion },
      data: datos,
    });

    return count > 0;
  }

  async eliminarIntegrante(idAsociacion: number, idIntegrante: number): Promise<boolean> {
    const { count } = await this.prisma.integranteAsociacion.deleteMany({
      where: { idIntegrante, idAsociacion },
    });

    return count > 0;
  }

  async listarIntegrantes(idAsociacion: number): Promise<IntegranteAdministrado[]> {
    return this.prisma.integranteAsociacion.findMany({
      where: { idAsociacion },
      orderBy: [{ ordenVisualizacion: "asc" }, { nombre: "asc" }],
      select: {
        idIntegrante: true,
        nombre: true,
        cargo: true,
        periodo: true,
        fotoUrl: true,
        ordenVisualizacion: true,
        activo: true,
      },
    });
  }

  async redSocialRegistrada(
    tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<boolean> {
    const existente = await this.prisma.redSocial.findFirst({
      where: {
        ...(tipo === "asociaciones" ? { idAsociacion: id } : { idClub: id }),
        plataforma: datos.plataforma,
        url: datos.url,
      },
      select: { idRedSocial: true },
    });

    return existente !== null;
  }

  async crearRedSocial(
    tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<number> {
    // La tabla exige que cada fila apunte a una asociación o a un club, nunca a
    // los dos: el campo que no corresponde se guarda explícitamente en nulo.
    const red = await this.prisma.redSocial.create({
      data: {
        plataforma: datos.plataforma,
        url: datos.url,
        idAsociacion: tipo === "asociaciones" ? id : null,
        idClub: tipo === "clubes" ? id : null,
      },
      select: { idRedSocial: true },
    });

    return red.idRedSocial;
  }

  async eliminarRedSocial(
    tipo: TipoOrganizacion,
    id: number,
    idRedSocial: number
  ): Promise<boolean> {
    const { count } = await this.prisma.redSocial.deleteMany({
      where: {
        idRedSocial,
        ...(tipo === "asociaciones" ? { idAsociacion: id } : { idClub: id }),
      },
    });

    return count > 0;
  }

  async listarRedesSociales(tipo: TipoOrganizacion, id: number): Promise<RedSocialAdministrada[]> {
    return this.prisma.redSocial.findMany({
      where: tipo === "asociaciones" ? { idAsociacion: id } : { idClub: id },
      orderBy: { plataforma: "asc" },
      select: { idRedSocial: true, plataforma: true, url: true },
    });
  }
}
