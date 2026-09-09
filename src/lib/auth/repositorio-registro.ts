import { EstadoUsuario, Prisma, type PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type CuentaCreada = {
  idUsuario: number;
  correo: string;
  nombreCompleto: string;
};

export type DatosCuentaNueva = {
  nombreCompleto: string;
  carnet: string;
  correo: string;
  idFacultad: number;
  idCarrera: number;
  contrasenaHash: string;
  tokenHash: string;
  fechaExpiracion: Date;
};

export type ResultadoCrearCuenta =
  { tipo: "creada"; cuenta: CuentaCreada } | { tipo: "duplicada" } | { tipo: "catalogo_invalido" };

export type CuentaParaReenvio = CuentaCreada;

export interface RepositorioRegistro {
  crearCuenta(datos: DatosCuentaNueva): Promise<ResultadoCrearCuenta>;
  consumirToken(tokenHash: string, fecha: Date): Promise<boolean>;
  prepararReenvio(datos: {
    correo: string;
    tokenHash: string;
    fechaExpiracion: Date;
    fecha: Date;
    segundosEspera: number;
    maximosPorHora: number;
  }): Promise<CuentaParaReenvio | null>;
}

function esRestriccionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export class RepositorioRegistroPrisma implements RepositorioRegistro {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async crearCuenta(datos: DatosCuentaNueva): Promise<ResultadoCrearCuenta> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const [duplicada, carrera, rolEstudiante] = await Promise.all([
            tx.estudiante.findFirst({
              where: { OR: [{ carnet: datos.carnet }, { correoUvg: datos.correo }] },
              select: { idEstudiante: true },
            }),
            tx.carrera.findFirst({
              where: {
                idCarrera: datos.idCarrera,
                idFacultad: datos.idFacultad,
                activo: true,
                facultad: { activo: true },
              },
              select: { idCarrera: true },
            }),
            tx.rol.findFirst({
              where: { nombre: { equals: "ESTUDIANTE", mode: "insensitive" }, activo: true },
              select: { idRol: true },
            }),
          ]);

          if (duplicada) return { tipo: "duplicada" } as const;
          if (!carrera) return { tipo: "catalogo_invalido" } as const;
          if (!rolEstudiante) {
            throw new Error("El rol de estudiante no está configurado.");
          }

          const estudiante = await tx.estudiante.create({
            data: {
              idCarrera: datos.idCarrera,
              carnet: datos.carnet,
              nombreCompleto: datos.nombreCompleto,
              correoUvg: datos.correo,
            },
          });
          const usuario = await tx.usuario.create({
            data: {
              idEstudiante: estudiante.idEstudiante,
              correo: datos.correo,
              contrasenaHash: datos.contrasenaHash,
              estado: EstadoUsuario.PENDIENTE,
              correoVerificado: false,
              roles: { create: { idRol: rolEstudiante.idRol } },
              tokensVerificacion: {
                create: {
                  tokenHash: datos.tokenHash,
                  fechaExpiracion: datos.fechaExpiracion,
                },
              },
            },
          });

          return {
            tipo: "creada",
            cuenta: {
              idUsuario: usuario.idUsuario,
              correo: usuario.correo,
              nombreCompleto: estudiante.nombreCompleto,
            },
          } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (esRestriccionUnica(error)) return { tipo: "duplicada" };
      throw error;
    }
  }

  async consumirToken(tokenHash: string, fecha: Date): Promise<boolean> {
    return this.prisma.$transaction(
      async (tx) => {
        const token = await tx.tokenVerificacionCorreo.findUnique({
          where: { tokenHash },
          include: { usuario: { select: { correoVerificado: true, estado: true } } },
        });

        if (
          !token ||
          token.fechaUso ||
          token.fechaInvalidacion ||
          token.fechaExpiracion <= fecha ||
          token.usuario.correoVerificado ||
          token.usuario.estado !== EstadoUsuario.PENDIENTE
        ) {
          return false;
        }

        const actualizado = await tx.tokenVerificacionCorreo.updateMany({
          where: {
            idToken: token.idToken,
            fechaUso: null,
            fechaInvalidacion: null,
            fechaExpiracion: { gt: fecha },
          },
          data: { fechaUso: fecha },
        });

        if (actualizado.count !== 1) return false;

        await tx.usuario.update({
          where: { idUsuario: token.idUsuario },
          data: { correoVerificado: true, estado: EstadoUsuario.ACTIVO },
        });
        await tx.tokenVerificacionCorreo.updateMany({
          where: {
            idUsuario: token.idUsuario,
            idToken: { not: token.idToken },
            fechaUso: null,
            fechaInvalidacion: null,
          },
          data: { fechaInvalidacion: fecha },
        });

        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  async prepararReenvio({
    correo,
    tokenHash,
    fechaExpiracion,
    fecha,
    segundosEspera,
    maximosPorHora,
  }: Parameters<RepositorioRegistro["prepararReenvio"]>[0]): Promise<CuentaParaReenvio | null> {
    return this.prisma.$transaction(
      async (tx) => {
        const usuario = await tx.usuario.findUnique({
          where: { correo },
          include: { estudiante: { select: { nombreCompleto: true } } },
        });

        if (!usuario || usuario.correoVerificado || usuario.estado !== EstadoUsuario.PENDIENTE) {
          return null;
        }

        const inicioHora = new Date(fecha.getTime() - 60 * 60_000);
        const [ultimoToken, cantidadHora] = await Promise.all([
          tx.tokenVerificacionCorreo.findFirst({
            where: { idUsuario: usuario.idUsuario },
            orderBy: { fechaCreacion: "desc" },
            select: { fechaCreacion: true },
          }),
          tx.tokenVerificacionCorreo.count({
            where: { idUsuario: usuario.idUsuario, fechaCreacion: { gte: inicioHora } },
          }),
        ]);
        const esperaCumplida =
          !ultimoToken ||
          fecha.getTime() - ultimoToken.fechaCreacion.getTime() >= segundosEspera * 1000;

        if (!esperaCumplida || cantidadHora >= maximosPorHora) return null;

        await tx.tokenVerificacionCorreo.updateMany({
          where: {
            idUsuario: usuario.idUsuario,
            fechaUso: null,
            fechaInvalidacion: null,
          },
          data: { fechaInvalidacion: fecha },
        });
        await tx.tokenVerificacionCorreo.create({
          data: { idUsuario: usuario.idUsuario, tokenHash, fechaExpiracion },
        });

        return {
          idUsuario: usuario.idUsuario,
          correo: usuario.correo,
          nombreCompleto: usuario.estudiante.nombreCompleto,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }
}
