import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";
import type { DatosPerfil } from "@/validators/perfil";

export interface RepositorioPerfil {
  carreraActiva(idCarrera: number): Promise<boolean>;
  /** Devuelve el estudiante dueño de la cuenta, o null si la cuenta no existe. */
  estudianteDeUsuario(idUsuario: number): Promise<number | null>;
  actualizar(idEstudiante: number, datos: DatosPerfil): Promise<boolean>;
}

export class RepositorioPerfilPrisma implements RepositorioPerfil {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async carreraActiva(idCarrera: number): Promise<boolean> {
    const carrera = await this.prisma.carrera.findFirst({
      where: { idCarrera, activo: true, facultad: { activo: true } },
      select: { idCarrera: true },
    });

    return carrera !== null;
  }

  async estudianteDeUsuario(idUsuario: number): Promise<number | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { idEstudiante: true },
    });

    return usuario?.idEstudiante ?? null;
  }

  async actualizar(idEstudiante: number, datos: DatosPerfil): Promise<boolean> {
    const { count } = await this.prisma.estudiante.updateMany({
      where: { idEstudiante },
      data: { telefono: datos.telefono, idCarrera: datos.idCarrera },
    });

    return count > 0;
  }
}
