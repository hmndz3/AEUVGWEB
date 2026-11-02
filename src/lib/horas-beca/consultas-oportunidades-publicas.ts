import type { Prisma } from "@prisma/client";

import { aHoraDeReloj } from "@/lib/horas-beca/horario-oportunidad";
import { obtenerPrisma } from "@/lib/prisma";

/** Convocatorias que presenta la sección pública de una sola vez. */
export const MAXIMO_OPORTUNIDADES_PUBLICAS = 60;

/** Una convocatoria tal como la ve el estudiantado. */
export type OportunidadPublica = {
  idOportunidad: number;
  nombre: string;
  descripcion: string;
  fecha: Date;
  /** Hora de inicio como "HH:MM". */
  horaInicio: string;
  horaFin: string;
  lugar: string;
  cantidadPersonas: number;
  informacionAdicional: string | null;
};

/**
 * Día de calendario de hoy en Guatemala, como la medianoche en UTC con la que
 * se guarda la fecha de la convocatoria.
 *
 * Se calcula en la zona del país y no en la del servidor: entre las 18:00 y la
 * medianoche de Guatemala, en UTC ya es el día siguiente, y una convocatoria de
 * hoy desaparecería del sitio esa misma tarde.
 */
export function hoyEnGuatemala(ahora = new Date()): Date {
  const clave = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Guatemala",
  }).format(ahora);

  return new Date(`${clave}T00:00:00.000Z`);
}

/**
 * Condición de la consulta pública.
 *
 * Vive aparte de la consulta para poder comprobarla sin base de datos: es la
 * regla que decide qué ve el estudiantado, y un error aquí dejaría a la vista
 * un borrador o retiraría del sitio una convocatoria de hoy.
 */
export function condicionesOportunidadesPublicas(
  ahora = new Date()
): Prisma.OportunidadHoraBecaWhereInput {
  return { estado: "PUBLICADA", fecha: { gte: hoyEnGuatemala(ahora) } };
}

/**
 * Orden de la consulta pública: lo más próximo primero, y a igual día la
 * convocatoria que empieza más temprano. El identificador desempata para que
 * dos iguales no cambien de sitio entre dos visitas.
 */
export const ORDEN_OPORTUNIDADES_PUBLICAS = [
  { fecha: "asc" },
  { horaInicio: "asc" },
  { idOportunidad: "asc" },
] as const satisfies Prisma.OportunidadHoraBecaOrderByWithRelationInput[];

/**
 * Convocatorias abiertas, de la más próxima a la más lejana.
 *
 * Solo las publicadas: un borrador es trabajo a medias y una cancelada ya no se
 * va a realizar. Las que ya pasaron se retiran por su fecha, sin que nadie
 * tenga que acordarse de cerrarlas: el listado compara contra el día de hoy, de
 * modo que una convocatoria se retira sola al día siguiente.
 */
export async function listarOportunidadesPublicadas(
  ahora = new Date()
): Promise<OportunidadPublica[]> {
  const filas = await obtenerPrisma().oportunidadHoraBeca.findMany({
    where: condicionesOportunidadesPublicas(ahora),
    orderBy: [...ORDEN_OPORTUNIDADES_PUBLICAS],
    take: MAXIMO_OPORTUNIDADES_PUBLICAS,
    select: {
      idOportunidad: true,
      nombre: true,
      descripcion: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      lugar: true,
      cantidadPersonas: true,
      informacionAdicional: true,
    },
  });

  return filas.map((fila) => ({
    ...fila,
    horaInicio: aHoraDeReloj(fila.horaInicio),
    horaFin: aHoraDeReloj(fila.horaFin),
  }));
}
