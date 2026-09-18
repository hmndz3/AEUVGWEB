import type { Prisma } from "@prisma/client";

import { normalizarTexto } from "@/lib/eventos/busqueda";
import type { FiltrosEventos } from "@/validators/eventos";

/**
 * Guatemala usa UTC-6 todo el año: no aplica horario de verano desde 2006, por
 * lo que el desplazamiento puede escribirse fijo. Las fechas del filtro llegan
 * como día calendario ("2026-09-20") y hay que convertirlas al instante que
 * corresponde, o un evento de las 7 de la noche quedaría fuera de su propio día.
 */
const DESPLAZAMIENTO = "-06:00";

export function inicioDelDiaEnGuatemala(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000${DESPLAZAMIENTO}`);
}

export function finDelDiaEnGuatemala(fecha: string): Date {
  return new Date(`${fecha}T23:59:59.999${DESPLAZAMIENTO}`);
}

/**
 * Traduce los filtros ya validados a la condición de la consulta.
 *
 * El rango de fechas se interpreta como cruce, no como contención: un evento
 * entra en el rango si alguna parte de su duración cae dentro. Indicar una
 * fecha de inicio sustituye la ventana predeterminada de "eventos que no han
 * terminado", de modo que quien busque una actividad pasada pueda encontrarla.
 */
export function condicionesDeFiltros(filtros: FiltrosEventos): Prisma.EventoWhereInput {
  const condiciones: Prisma.EventoWhereInput = {};
  const conjunciones: Prisma.EventoWhereInput[] = [];

  // La búsqueda compara contra la copia normalizada del evento, de modo que
  // ignore mayúsculas y acentos por igual (ver src/lib/eventos/busqueda.ts).
  if (filtros.q) condiciones.textoBusqueda = { contains: normalizarTexto(filtros.q) };
  if (filtros.desde) condiciones.fechaFin = { gte: inicioDelDiaEnGuatemala(filtros.desde) };
  if (filtros.hasta) condiciones.fechaInicio = { lte: finDelDiaEnGuatemala(filtros.hasta) };
  if (filtros.categoria) condiciones.idCategoriaEvento = filtros.categoria;
  if (filtros.tipo) condiciones.tipoActividad = filtros.tipo;

  // Asociación y club son organizadores distintos del mismo evento, así que se
  // combinan con AND: pedir ambos busca el evento que organizan en conjunto.
  if (filtros.asociacion) {
    conjunciones.push({ organizadores: { some: { idAsociacion: filtros.asociacion } } });
  }
  if (filtros.club) {
    conjunciones.push({ organizadores: { some: { idClub: filtros.club } } });
  }

  if (conjunciones.length > 0) condiciones.AND = conjunciones;

  return condiciones;
}
