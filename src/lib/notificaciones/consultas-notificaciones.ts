import { obtenerPrisma } from "@/lib/prisma";

/** Avisos que se presentan de una vez. Más abajo no los lee nadie. */
export const MAXIMO_NOTIFICACIONES = 50;

export type NotificacionVista = {
  idNotificacion: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  urlDestino: string | null;
  leida: boolean;
  fechaEnvio: Date;
};

/** Avisos de la cuenta de la sesión, del más reciente al más antiguo. */
export async function listarNotificaciones(idUsuario: number): Promise<NotificacionVista[]> {
  return obtenerPrisma().notificacion.findMany({
    where: { idUsuario },
    orderBy: { fechaEnvio: "desc" },
    take: MAXIMO_NOTIFICACIONES,
    select: {
      idNotificacion: true,
      titulo: true,
      mensaje: true,
      tipo: true,
      urlDestino: true,
      leida: true,
      fechaEnvio: true,
    },
  });
}

/** Cuántos avisos sin leer tiene la cuenta, para el contador del encabezado. */
export async function contarNoLeidas(idUsuario: number): Promise<number> {
  return obtenerPrisma().notificacion.count({ where: { idUsuario, leida: false } });
}
