import { z } from "zod";

import type { FiltrosCuentas } from "@/lib/admin/consultas-cuentas";

/** Estados que puede tener una cuenta. Coinciden con el enum de la base. */
export const ESTADOS_CUENTA = ["ACTIVO", "PENDIENTE", "BLOQUEADO"] as const;

export type EstadoCuenta = (typeof ESTADOS_CUENTA)[number];

export const ETIQUETAS_ESTADO_CUENTA: Record<EstadoCuenta, string> = {
  ACTIVO: "Activa",
  PENDIENTE: "Pendiente",
  BLOQUEADO: "Bloqueada",
};

export const VERIFICACIONES = ["verificados", "sin-verificar"] as const;

export const ETIQUETAS_VERIFICACION: Record<(typeof VERIFICACIONES)[number], string> = {
  verificados: "Con correo verificado",
  "sin-verificar": "Sin verificar",
};

const identificador = z.coerce.number().int().positive();

/** Longitud mínima del texto de búsqueda; con menos, cualquier cuenta coincide. */
export const MINIMO_BUSQUEDA_CUENTAS = 2;

const esquemaFiltros = z.object({
  q: z.string().trim().min(MINIMO_BUSQUEDA_CUENTAS).max(80),
  estado: z.enum(ESTADOS_CUENTA),
  facultad: identificador,
  verificacion: z.enum(VERIFICACIONES),
  pagina: identificador,
});

type ValorCrudo = string | string[] | undefined;

/**
 * Interpreta los parámetros de la dirección quedándose solo con los válidos.
 *
 * Mismo criterio que el resto de los filtros del panel: uno mal escrito se
 * descarta en silencio y la pantalla se presenta sin él, en lugar de devolver
 * un error por una dirección que alguien escribió a mano.
 */
export function interpretarFiltrosCuentas(parametros: Record<string, ValorCrudo>): FiltrosCuentas {
  const leer = (clave: string) => {
    const valor = parametros[clave];
    const texto = Array.isArray(valor) ? valor[0] : valor;
    return texto && texto.length > 0 ? texto : undefined;
  };

  const filtros: Record<string, unknown> = {};

  for (const [clave, regla] of Object.entries(esquemaFiltros.shape)) {
    const crudo = leer(clave);
    if (crudo === undefined) continue;

    const resultado = regla.safeParse(clave === "estado" ? crudo.toUpperCase() : crudo);
    if (resultado.success) filtros[clave] = resultado.data;
  }

  return filtros as FiltrosCuentas;
}

/** Los filtros de vuelta a parámetros de dirección, para construir enlaces. */
export function parametrosDeCuentas(filtros: FiltrosCuentas): Record<string, string> {
  const parametros: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(filtros)) {
    if (clave === "pagina" || valor === undefined) continue;
    parametros[clave] = String(valor);
  }

  return parametros;
}
