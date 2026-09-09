import type { EstadoUsuario, PrismaClient } from "@prisma/client";

import { normalizarRol, type Rol } from "@/lib/auth/roles";
import { obtenerPrisma } from "@/lib/prisma";

export type UsuarioAutenticacion = {
  idUsuario: number;
  correo: string;
  contrasenaHash: string;
  estado: EstadoUsuario;
  correoVerificado: boolean;
  nombreCompleto: string;
  roles: Rol[];
};

export type UsuarioSesion = Omit<UsuarioAutenticacion, "contrasenaHash">;

export interface RepositorioAutenticacion {
  buscarPorCorreo(correo: string): Promise<UsuarioAutenticacion | null>;
  buscarPorId(idUsuario: number): Promise<UsuarioSesion | null>;
  registrarAcceso(idUsuario: number, fecha: Date): Promise<void>;
}

type FilaRol = { rol: { nombre: string } };

/** Descarta cualquier nombre que no corresponda a un rol conocido del sistema. */
function rolesDe(filas: FilaRol[]): Rol[] {
  return filas.flatMap((fila) => {
    const rol = normalizarRol(fila.rol.nombre);
    return rol ? [rol] : [];
  });
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
          roles: {
            where: { activo: true, rol: { activo: true } },
            select: { rol: { select: { nombre: true } } },
          },
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
              roles: rolesDe(usuario.roles),
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
          roles: {
            where: { activo: true, rol: { activo: true } },
            select: { rol: { select: { nombre: true } } },
          },
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
              roles: rolesDe(usuario.roles),
            }
          : null
      );
  }

  async registrarAcceso(idUsuario: number, fecha: Date): Promise<void> {
    await this.prisma.usuario.update({ where: { idUsuario }, data: { ultimoAcceso: fecha } });
  }
}
