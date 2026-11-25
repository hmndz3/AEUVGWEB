import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";
import type { DatosCursoAdmin } from "@/validators/tutoria";

/** Dónde se usa un curso: lo que impide borrarlo sin perder historial. */
export type UsosCurso = { postulaciones: number; tutores: number; tutorias: number };

export interface RepositorioCursos {
  /** True si otro curso ya tiene ese código, sin distinguir mayúsculas. */
  codigoEnUso(codigo: string, excepto?: number): Promise<boolean>;
  crear(datos: DatosCursoAdmin): Promise<number>;
  /** Devuelve false si el curso no existe. */
  actualizar(idCurso: number, datos: DatosCursoAdmin): Promise<boolean>;
  /** Null si el curso no existe. */
  usos(idCurso: number): Promise<UsosCurso | null>;
  eliminar(idCurso: number): Promise<boolean>;
}

export class RepositorioCursosPrisma implements RepositorioCursos {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async codigoEnUso(codigo: string, excepto?: number): Promise<boolean> {
    const cuantos = await this.prisma.curso.count({
      where: {
        codigo: { equals: codigo, mode: "insensitive" },
        ...(excepto ? { NOT: { idCurso: excepto } } : {}),
      },
    });

    return cuantos > 0;
  }

  async crear(datos: DatosCursoAdmin): Promise<number> {
    const curso = await this.prisma.curso.create({
      data: { codigo: datos.codigo, nombre: datos.nombre, activo: datos.activo },
      select: { idCurso: true },
    });

    return curso.idCurso;
  }

  /**
   * Activar un curso propuesto es admitirlo en el catálogo, así que deja de
   * estar marcado como propuesto; desactivarlo no lo vuelve a marcar.
   */
  async actualizar(idCurso: number, datos: DatosCursoAdmin): Promise<boolean> {
    const { count } = await this.prisma.curso.updateMany({
      where: { idCurso },
      data: {
        codigo: datos.codigo,
        nombre: datos.nombre,
        activo: datos.activo,
        ...(datos.activo ? { propuesto: false } : {}),
      },
    });

    return count > 0;
  }

  async usos(idCurso: number): Promise<UsosCurso | null> {
    const curso = await this.prisma.curso.findUnique({
      where: { idCurso },
      select: {
        _count: { select: { postulaciones: true, tutores: true, tutorias: true } },
      },
    });

    return curso ? curso._count : null;
  }

  async eliminar(idCurso: number): Promise<boolean> {
    const { count } = await this.prisma.curso.deleteMany({ where: { idCurso } });

    return count > 0;
  }
}
