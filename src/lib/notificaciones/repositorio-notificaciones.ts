import type { PrismaClient } from "@prisma/client";

import {
  ServicioNotificaciones,
  type RepositorioNotificaciones,
} from "@/lib/notificaciones/servicio-notificaciones";
import { obtenerPrisma } from "@/lib/prisma";

export class RepositorioNotificacionesPrisma implements RepositorioNotificaciones {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  /**
   * La cuenta entra en la condición y no se comprueba aparte: así una
   * notificación ajena no se marca ni siquiera por accidente, sin tener que
   * leerla antes para compararla.
   */
  async marcarLeida(idNotificacion: number, idUsuario: number, ahora: Date): Promise<boolean> {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { idNotificacion, idUsuario, leida: false },
      data: { leida: true, fechaLectura: ahora },
    });

    return count > 0;
  }

  async marcarTodas(idUsuario: number, ahora: Date): Promise<number> {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { idUsuario, leida: false },
      data: { leida: true, fechaLectura: ahora },
    });

    return count;
  }
}

export function crearServicioNotificaciones(): ServicioNotificaciones {
  return new ServicioNotificaciones(new RepositorioNotificacionesPrisma());
}
