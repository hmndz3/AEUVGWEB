import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export interface RepositorioEventosGuardados {
  /** Indica si el evento existe y está publicado, que es lo único que se puede guardar. */
  eventoPublicado(idEvento: number): Promise<boolean>;
  guardar(idUsuario: number, idEvento: number): Promise<void>;
  quitar(idUsuario: number, idEvento: number): Promise<boolean>;
  idsGuardados(idUsuario: number, idsEventos: number[]): Promise<number[]>;
}

export class RepositorioEventosGuardadosPrisma implements RepositorioEventosGuardados {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async eventoPublicado(idEvento: number): Promise<boolean> {
    const evento = await this.prisma.evento.findFirst({
      where: { idEvento, estado: "PUBLICADO" },
      select: { idEvento: true },
    });

    return evento !== null;
  }

  /**
   * Guarda el evento sin fallar si ya estaba guardado: la tabla tiene una
   * restricción de unicidad por usuario y evento, y pulsar dos veces el control
   * no es un error que haya que reportarle a nadie.
   */
  async guardar(idUsuario: number, idEvento: number): Promise<void> {
    await this.prisma.eventoGuardado.upsert({
      where: { idUsuario_idEvento: { idUsuario, idEvento } },
      create: { idUsuario, idEvento },
      update: {},
    });
  }

  async quitar(idUsuario: number, idEvento: number): Promise<boolean> {
    const { count } = await this.prisma.eventoGuardado.deleteMany({
      where: { idUsuario, idEvento },
    });

    return count > 0;
  }

  async idsGuardados(idUsuario: number, idsEventos: number[]): Promise<number[]> {
    if (idsEventos.length === 0) return [];

    const guardados = await this.prisma.eventoGuardado.findMany({
      where: { idUsuario, idEvento: { in: idsEventos } },
      select: { idEvento: true },
    });

    return guardados.map((guardado) => guardado.idEvento);
  }
}
