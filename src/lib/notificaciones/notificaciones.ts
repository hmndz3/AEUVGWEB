import { obtenerPrisma } from "@/lib/prisma";
import type { TipoNotificacion } from "@/lib/notificaciones/tipos-notificacion";

export { TIPOS_NOTIFICACION } from "@/lib/notificaciones/tipos-notificacion";
export type { TipoNotificacion };

export type NuevaNotificacion = {
  idUsuario: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  urlDestino?: string | null;
};

/**
 * Guarda un aviso para una cuenta.
 *
 * Nunca lanza: una notificación es un acompañamiento de la operación, no la
 * operación. Si el aviso falla, la postulación revisada o la tutoría agendada
 * ya ocurrieron y hacer fallar la petición por el aviso sería peor que
 * quedarse sin él. El motivo se registra para poder rastrearlo.
 */
export async function notificar(datos: NuevaNotificacion): Promise<void> {
  try {
    await obtenerPrisma().notificacion.create({
      data: {
        idUsuario: datos.idUsuario,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        tipo: datos.tipo,
        urlDestino: datos.urlDestino ?? null,
      },
    });
  } catch (error) {
    console.error(
      "No se pudo guardar una notificación:",
      error instanceof Error ? error.message : error
    );
  }
}

/** Avisa a varias cuentas de lo mismo, sin detenerse si una falla. */
export async function notificarA(
  idsUsuario: readonly number[],
  datos: Omit<NuevaNotificacion, "idUsuario">
): Promise<void> {
  await Promise.all(idsUsuario.map((idUsuario) => notificar({ ...datos, idUsuario })));
}

/** La cuenta que corresponde a una ficha de estudiante, para poder avisarle. */
export async function usuarioDeEstudiante(idEstudiante: number): Promise<number | null> {
  const usuario = await obtenerPrisma().usuario.findFirst({
    where: { idEstudiante },
    select: { idUsuario: true },
  });

  return usuario?.idUsuario ?? null;
}
