import type { EstadoEvento } from "@prisma/client";

/**
 * Estado que se le muestra al estudiante. No se guarda en la base: el estado
 * almacenado solo distingue borrador, publicado, cancelado y finalizado, y
 * nadie marca un evento como finalizado a mano cuando pasa la fecha. Por eso
 * la situación real se deriva de las fechas cada vez que se muestra.
 */
export type EstadoVisible = "proximo" | "en_curso" | "finalizado" | "cancelado" | "borrador";

export type EventoConFechas = {
  estado: EstadoEvento;
  fechaInicio: Date;
  fechaFin: Date;
};

export function estadoVisible(evento: EventoConFechas, ahora = new Date()): EstadoVisible {
  if (evento.estado === "CANCELADO") return "cancelado";
  if (evento.estado === "BORRADOR") return "borrador";

  if (evento.fechaFin.getTime() < ahora.getTime()) return "finalizado";
  if (evento.fechaInicio.getTime() <= ahora.getTime()) return "en_curso";

  return "proximo";
}

const ETIQUETAS: Record<EstadoVisible, string> = {
  proximo: "Próximo",
  en_curso: "En curso",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  borrador: "Borrador",
};

// Los tonos son los que ya usa EtiquetaEstado en el resto de la plataforma.
const TONOS = {
  proximo: "informativo",
  en_curso: "acreditada",
  finalizado: "neutro",
  cancelado: "error",
  borrador: "pendiente",
} as const;

export function etiquetaEstado(estado: EstadoVisible): string {
  return ETIQUETAS[estado];
}

export function tonoEstado(estado: EstadoVisible): (typeof TONOS)[EstadoVisible] {
  return TONOS[estado];
}
