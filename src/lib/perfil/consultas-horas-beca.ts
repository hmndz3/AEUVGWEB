import type { EstadoHoraBeca } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Una actividad del historial de horas beca del estudiante. */
export type ActividadHoraBeca = {
  idRegistroHora: number;
  fechaActividad: Date;
  horarioApoyo: string;
  descripcionActividad: string;
  cantidadHoras: number;
  estado: EstadoHoraBeca;
  fechaAcreditacion: Date | null;
};

/**
 * Horas beca del estudiante dueño de la sesión.
 *
 * Se consulta siempre a partir del identificador del usuario de la sesión y
 * nunca de un parámetro de la dirección, igual que el resto del perfil: así no
 * existe forma de pedir las horas de otra persona.
 *
 * Solo devuelve los registros vinculados a la cuenta. Un registro que AEUVG
 * cargó a un carnet sin cuenta no pertenece a nadie en la plataforma hasta que
 * su dueño se registra, momento en el que la vinculación lo alcanza
 * (`src/lib/horas-beca/vinculacion-horas.ts`).
 *
 * El historial va de la actividad más reciente a la más antigua: lo que el
 * estudiante viene a comprobar es si ya le acreditaron lo último que hizo.
 */
export async function obtenerActividadesHoraBeca(idUsuario: number): Promise<ActividadHoraBeca[]> {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) return [];

  const registros = await obtenerPrisma().registroHoraBeca.findMany({
    where: { estudiante: { usuario: { idUsuario } } },
    orderBy: [{ fechaActividad: "desc" }, { idRegistroHora: "desc" }],
    select: {
      idRegistroHora: true,
      fechaActividad: true,
      horarioApoyo: true,
      descripcionActividad: true,
      cantidadHoras: true,
      estado: true,
      fechaAcreditacion: true,
    },
  });

  return registros.map((registro) => ({
    ...registro,
    cantidadHoras: Number(registro.cantidadHoras),
  }));
}
