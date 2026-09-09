import type { EstadoUsuario, PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type UsuarioAutenticacion = {
  idUsuario: number;
  correo: string;
  contrasenaHash: string;
  estado: EstadoUsuario;
  correoVerificado: boolean;
  nombreCompleto: string;
};

export type UsuarioSesion = Omit<UsuarioAutenticacion, "contrasenaHash">;

export interface RepositorioAutenticacion {
  buscarPorCorreo(correo: string): Promise<UsuarioAutenticacion | null>;
  buscarPorId(idUsuario: number): Promise<UsuarioSesion | null>;
  registrarAcceso(idUsuario: number, fecha: Date): Promise<void>;
}

export class RepositorioAutenticacionPrisma implements RepositorioAutenticacion {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async buscarPorCorreo(correo: string): Promise<UsuarioAutenticacion | null> {
    return this.prisma.usuario
      .findUnique({
        where: { correo },
        select: {
          idUsuario: true,
          correo: true,
          contrasenaHash: true,
          estado: true,
          correoVerificado: true,
          estudiante: { select: { nombreCompleto: true } },
        },
      })
      .then((usuario) =>
        usuario
          ? {
              idUsuario: usuario.idUsuario,
              correo: usuario.correo,
              contrasenaHash: usuario.contrasenaHash,
              estado: usuario.estado,
              correoVerificado: usuario.correoVerificado,
              nombreCompleto: usuario.estudiante.nombreCompleto,
            }
          : null
      );
  }

  async buscarPorId(idUsuario: number): Promise<UsuarioSesion | null> {
    return this.prisma.usuario
      .findUnique({
        where: { idUsuario },
        select: {
          idUsuario: true,
          correo: true,
          estado: true,
          correoVerificado: true,
          estudiante: { select: { nombreCompleto: true } },
        },
      })
      .then((usuario) =>
        usuario
          ? {
              idUsuario: usuario.idUsuario,
              correo: usuario.correo,
              estado: usuario.estado,
              correoVerificado: usuario.correoVerificado,
              nombreCompleto: usuario.estudiante.nombreCompleto,
            }
          : null
      );
  }

  async registrarAcceso(idUsuario: number, fecha: Date): Promise<void> {
    await this.prisma.usuario.update({ where: { idUsuario }, data: { ultimoAcceso: fecha } });
  }
}
