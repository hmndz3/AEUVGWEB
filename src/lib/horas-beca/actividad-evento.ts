import { obtenerPrisma } from "@/lib/prisma";

/** Un evento que puede elegirse como actividad de un registro de horas. */
export type EventoDeActividad = {
  idEvento: number;
  nombre: string;
  /** Día del evento en Guatemala, como "AAAA-MM-DD", para sugerir la fecha. */
  fecha: string;
};

/** Eventos que se ofrecen en el selector. Más atrás ya no se registra nada. */
export const MAXIMO_EVENTOS_ACTIVIDAD = 300;

const diaEnGuatemala = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Guatemala",
});

/**
 * Eventos que pueden ser la actividad de un registro de horas: los publicados
 * y los finalizados que ya empezaron, del más reciente al más antiguo. Los
 * borradores no se realizaron todavía, los cancelados no se realizaron nunca y
 * los futuros no pueden tener horas, porque se registran por el apoyo ya
 * prestado. Cuenta hasta el final del día de hoy en Guatemala, para que un
 * evento de esta tarde ya se pueda elegir por la mañana.
 */
export async function listarEventosDeActividad(
  ahora: Date = new Date()
): Promise<EventoDeActividad[]> {
  // Guatemala no tiene horario de verano: el día termina a las 06:00 UTC.
  const finDeHoy = new Date(`${diaEnGuatemala.format(ahora)}T00:00:00-06:00`);
  finDeHoy.setUTCDate(finDeHoy.getUTCDate() + 1);

  const filas = await obtenerPrisma().evento.findMany({
    where: { estado: { in: ["PUBLICADO", "FINALIZADO"] }, fechaInicio: { lt: finDeHoy } },
    orderBy: [{ fechaInicio: "desc" }, { idEvento: "desc" }],
    take: MAXIMO_EVENTOS_ACTIVIDAD,
    select: { idEvento: true, nombre: true, fechaInicio: true },
  });

  return filas.map((fila) => ({
    idEvento: fila.idEvento,
    nombre: fila.nombre,
    fecha: diaEnGuatemala.format(fila.fechaInicio),
  }));
}

/** Un evento por su identificador, si puede ser la actividad de un registro. */
export async function obtenerEventoDeActividad(
  idEvento: number
): Promise<{ idEvento: number; nombre: string } | null> {
  return obtenerPrisma().evento.findFirst({
    where: { idEvento, estado: { in: ["PUBLICADO", "FINALIZADO"] } },
    select: { idEvento: true, nombre: true },
  });
}

/**
 * Pone el nombre del evento como descripción de la actividad.
 *
 * La descripción se guarda aunque haya evento: es lo que lee el estudiante en
 * su historial, lo que exportan los reportes y lo que se busca en el panel, y
 * así todo eso sigue igual que con las actividades escritas a mano. El nombre
 * sale del evento y no del cuerpo de la petición, para que no puedan diferir.
 */
export function aplicarEventoDeActividad<
  T extends { idEvento?: number | null; descripcionActividad: string },
>(
  datos: T,
  evento: { idEvento: number; nombre: string } | null
): { valido: true; datos: T } | { valido: false; errores: Record<string, string> } {
  if (!datos.idEvento) return { valido: true, datos: { ...datos, idEvento: null } };

  if (!evento || evento.idEvento !== datos.idEvento) {
    return {
      valido: false,
      errores: { idEvento: "El evento elegido ya no está disponible. Elige otro." },
    };
  }

  return { valido: true, datos: { ...datos, descripcionActividad: evento.nombre } };
}

/** Busca el evento de los datos, si traen uno, y lo aplica a la descripción. */
export async function resolverEventoDeActividad<
  T extends { idEvento?: number | null; descripcionActividad: string },
>(datos: T) {
  const evento = datos.idEvento ? await obtenerEventoDeActividad(datos.idEvento) : null;

  return aplicarEventoDeActividad(datos, evento);
}
