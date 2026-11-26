import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/**
 * Lo que la importación de cursos necesita de la base.
 *
 * Solo una consulta: qué códigos ya están registrados y con qué nombre. La
 * creación la hace el mismo servicio del catálogo, así que las reglas no se
 * duplican aquí.
 */
export interface RepositorioImportacionCursos {
  /** Código en mayúsculas → nombre guardado. */
  registrados(): Promise<Map<string, string>>;
}

export class RepositorioImportacionCursosPrisma implements RepositorioImportacionCursos {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async registrados(): Promise<Map<string, string>> {
    const cursos = await this.prisma.curso.findMany({ select: { codigo: true, nombre: true } });

    // El esquema guarda el código en mayúsculas y sin espacios, igual que lo
    // deja el validador, así que basta con normalizar por si acaso.
    return new Map(
      cursos.map((curso) => [curso.codigo.toUpperCase().replace(/\s+/g, ""), curso.nombre])
    );
  }
}
