import { z } from "zod";

import { TIPOS_ACTIVIDAD } from "@/validators/eventos";

/**
 * Filtros del reporte de eventos.
 *
 * Son los mismos que el panel muestra y los que arrastra la descarga, de modo
 * que el archivo contenga exactamente lo que está en pantalla. Igual que en el
 * listado público, un parámetro con basura se descarta en silencio en lugar de
 * tumbar la página: la dirección la escribe cualquiera.
 */

export const ESTADOS_EVENTO = ["BORRADOR", "PUBLICADO", "CANCELADO", "FINALIZADO"] as const;

export type EstadoEventoFiltro = (typeof ESTADOS_EVENTO)[number];

export const ETIQUETAS_ESTADO_EVENTO: Record<EstadoEventoFiltro, string> = {
  BORRADOR: "Borrador",
  PUBLICADO: "Publicado",
  CANCELADO: "Cancelado",
  FINALIZADO: "Finalizado",
};

/**
 * Siglas con las que se reconoce a la asociación organizadora de la plataforma.
 *
 * AEUVG está en el catálogo de asociaciones como cualquier otra; el reporte
 * necesita poder señalarla sin depender de un identificador que cambia entre
 * ambientes, así que se busca por este nombre.
 */
export const NOMBRE_AEUVG = "AEUVG";

/**
 * Quién organizó el evento.
 *
 * "aeuvg" es el filtro que AEUVG pidió expresamente: los eventos que organizó
 * ella misma. Los demás valores apuntan a una asociación o a un club concretos.
 */
const PATRON_ORGANIZADOR = /^(aeuvg|asociacion:\d+|club:\d+)$/;

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const identificador = z.coerce.number().int().positive();

export const esquemaFiltrosEventosReporte = z.object({
  desde: fechaIso,
  hasta: fechaIso,
  categoria: identificador,
  tipo: z.enum(TIPOS_ACTIVIDAD),
  estado: z.enum(ESTADOS_EVENTO),
  organizador: z.string().regex(PATRON_ORGANIZADOR),
});

export type FiltrosEventosReporte = Partial<z.infer<typeof esquemaFiltrosEventosReporte>>;

type ValorCrudo = string | string[] | undefined;

function primerValor(valor: ValorCrudo): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  return texto && texto.length > 0 ? texto : undefined;
}

export function interpretarFiltrosEventosReporte(
  parametros: Record<string, ValorCrudo> | URLSearchParams
): FiltrosEventosReporte {
  const leer = (clave: string): string | undefined =>
    parametros instanceof URLSearchParams
      ? (parametros.get(clave) ?? undefined) || undefined
      : primerValor(parametros[clave]);

  const filtros: Record<string, unknown> = {};

  for (const [clave, regla] of Object.entries(esquemaFiltrosEventosReporte.shape)) {
    const crudo = leer(clave);
    if (crudo === undefined) continue;

    const resultado = regla.safeParse(crudo);
    if (resultado.success) filtros[clave] = resultado.data;
  }

  // Un periodo al revés no devuelve nada y parece un error de la página; se
  // ordena, que es lo que quiso decir quien lo escribió.
  const { desde, hasta } = filtros as { desde?: string; hasta?: string };
  if (desde && hasta && desde > hasta) {
    filtros.desde = hasta;
    filtros.hasta = desde;
  }

  return filtros as FiltrosEventosReporte;
}

/** Los filtros como parámetros de dirección, para que la descarga los arrastre. */
export function parametrosDeFiltrosEventos(filtros: FiltrosEventosReporte): Record<string, string> {
  const parametros: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined) parametros[clave] = String(valor);
  }

  return parametros;
}

/** Cuántos filtros hay puestos, para decir en pantalla si el reporte está acotado. */
export function contarFiltrosEventos(filtros: FiltrosEventosReporte): number {
  return Object.values(filtros).filter((valor) => valor !== undefined).length;
}

export type Organizador =
  { tipo: "aeuvg" } | { tipo: "asociacion"; id: number } | { tipo: "club"; id: number };

/** Interpreta el valor del filtro de organizador; null si no viene o no sirve. */
export function interpretarOrganizador(valor: string | undefined): Organizador | null {
  if (!valor) return null;
  if (valor === "aeuvg") return { tipo: "aeuvg" };

  const [tipo, id] = valor.split(":");
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) return null;
  if (tipo === "asociacion") return { tipo: "asociacion", id: numero };
  if (tipo === "club") return { tipo: "club", id: numero };

  return null;
}
