import { EstadoUsuario, Prisma, type PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type CuentaRecuperacion = {
  idUsuario: number;
  correo: string;
  nombreCompleto: string;
};

export interface RepositorioRecuperacion {
  /** Registra un token nuevo e invalida los anteriores. Devuelve null si la
   *  cuenta no existe, no está activa, o si aún no se cumple el límite de envío. */
  prepararRecuperacion(datos: {
    correo: string;
    tokenHash: string;
    fechaExpiracion: Date;
    fecha: Date;
    segundosEspera: number;
    maximosPorHora: number;
  }): Promise<CuentaRecuperacion | null>;

  /** Consume el token y guarda la contraseña nueva. Devuelve false si el token
   *  no existe, ya fue usado, fue invalidado o venció. */
  restablecerContrasena(datos: {
    tokenHash: string;
    contrasenaHash: string;
    fecha: Date;
  }): Promise<boolean>;
}

export class RepositorioRecuperacionPrisma implements RepositorioRecuperacion {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async prepararRecuperacion({
    correo,
    tokenHash,
    fechaExpiracion,
    fecha,
    segundosEspera,
    maximosPorHora,
  }: Parameters<RepositorioRecuperacion["prepararRecuperacion"]>[0]) {
    return this.prisma.$transaction(
      async (tx) => {
        const usuario = await tx.usuario.findUnique({
          where: { correo },
          include: { estudiante: { select: { nombreCompleto: true } } },
        });

        // Solo las cuentas verificadas y activas pueden restablecer contraseña.
        if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO || !usuario.correoVerificado) {
          return null;
        }

        const inicioHora = new Date(fecha.getTime() - 60 * 60_000);
        const [ultimoToken, cantidadHora] = await Promise.all([
          tx.tokenRecuperacionContrasena.findFirst({
            where: { idUsuario: usuario.idUsuario },
            orderBy: { fechaCreacion: "desc" },
            select: { fechaCreacion: true },
          }),
          tx.tokenRecuperacionContrasena.count({
            where: { idUsuario: usuario.idUsuario, fechaCreacion: { gte: inicioHora } },
          }),
        ]);
        const esperaCumplida =
          !ultimoToken ||
          fecha.getTime() - ultimoToken.fechaCreacion.getTime() >= segundosEspera * 1000;

        if (!esperaCumplida || cantidadHora >= maximosPorHora) return null;

        await tx.tokenRecuperacionContrasena.updateMany({
          where: { idUsuario: usuario.idUsuario, fechaUso: null, fechaInvalidacion: null },
          data: { fechaInvalidacion: fecha },
        });
        await tx.tokenRecuperacionContrasena.create({
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

  async restablecerContrasena({
    tokenHash,
    contrasenaHash,
    fecha,
  }: Parameters<RepositorioRecuperacion["restablecerContrasena"]>[0]): Promise<boolean> {
    return this.prisma.$transaction(
      async (tx) => {
        const token = await tx.tokenRecuperacionContrasena.findUnique({
          where: { tokenHash },
          include: { usuario: { select: { estado: true, correoVerificado: true } } },
        });

        if (
          !token ||
          token.fechaUso ||
          token.fechaInvalidacion ||
          token.fechaExpiracion <= fecha ||
          token.usuario.estado !== EstadoUsuario.ACTIVO ||
          !token.usuario.correoVerificado
        ) {
          return false;
        }

        // updateMany con las mismas condiciones evita que dos peticiones
        // simultáneas consuman el mismo token.
        const consumido = await tx.tokenRecuperacionContrasena.updateMany({
          where: {
            idToken: token.idToken,
            fechaUso: null,
            fechaInvalidacion: null,
            fechaExpiracion: { gt: fecha },
          },
          data: { fechaUso: fecha },
        });

        if (consumido.count !== 1) return false;

        await tx.usuario.update({
          where: { idUsuario: token.idUsuario },
          data: { contrasenaHash },
        });
        await tx.tokenRecuperacionContrasena.updateMany({
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
}
