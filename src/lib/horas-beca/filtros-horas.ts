import type { Prisma } from "@prisma/client";

import { normalizarTexto } from "@/lib/horas-beca/busqueda-horas";
import type { FiltrosHorasBeca } from "@/validators/horas-beca";

/**
 * La fecha de la actividad es un día de calendario (`date`), no un instante.
 *
 * A diferencia de los eventos, que se guardan como `timestamptz` y hay que
 * trasladar a la hora de Guatemala, aquí la columna no tiene hora: PostgreSQL la
 * compara contra la medianoche en UTC. Convertirla al desplazamiento del país
 * desplazaría el rango un día y dejaría fuera justo los registros del borde.
 */
export function diaCalendario(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/**
 * Traduce los filtros ya validados a la condición de la consulta.
 *
 * El rango de fechas se interpreta sobre la fecha de la actividad, que es la que
 * define el periodo del que AEUVG rinde cuentas, y no sobre la fecha en que el
 * registro se cargó.
 */
export function condicionesDeFiltrosHoras(
  filtros: FiltrosHorasBeca
): Prisma.RegistroHoraBecaWhereInput {
  const condiciones: Prisma.RegistroHoraBecaWhereInput = {};

  if (filtros.q) condiciones.textoBusqueda = { contains: normalizarTexto(filtros.q) };
  if (filtros.estado) condiciones.estado = filtros.estado;
  if (filtros.vinculo) {
    condiciones.idEstudiante = filtros.vinculo === "vinculados" ? { not: null } : null;
  }

  if (filtros.desde || filtros.hasta) {
    condiciones.fechaActividad = {
      ...(filtros.desde ? { gte: diaCalendario(filtros.desde) } : {}),
      ...(filtros.hasta ? { lte: diaCalendario(filtros.hasta) } : {}),
    };
  }

  return condiciones;
}
