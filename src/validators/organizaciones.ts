import { z } from "zod";

import { MAXIMO_BUSQUEDA, MINIMO_BUSQUEDA } from "@/validators/eventos";

/**
 * Parámetros del listado de asociaciones y de clubes. Se validan por separado
 * porque la dirección la escribe cualquiera: un parámetro con basura no debe
 * tumbar la página, solo descartarse.
 */
export const esquemaFiltrosOrganizaciones = z.object({
  q: z.string().trim().min(MINIMO_BUSQUEDA).max(MAXIMO_BUSQUEDA),
  pagina: z.coerce.number().int().positive(),
});

export type FiltrosOrganizaciones = Partial<z.infer<typeof esquemaFiltrosOrganizaciones>>;

type ValorCrudo = string | string[] | undefined;

/** Interpreta los parámetros de la dirección quedándose solo con los válidos. */
export function interpretarFiltrosOrganizaciones(
  parametros: Record<string, ValorCrudo>
): FiltrosOrganizaciones {
  const filtros: Record<string, unknown> = {};

  for (const [clave, regla] of Object.entries(esquemaFiltrosOrganizaciones.shape)) {
    const valor = parametros[clave];
    const crudo = Array.isArray(valor) ? valor[0] : valor;
    if (!crudo) continue;

    const resultado = regla.safeParse(crudo);
    if (resultado.success) filtros[clave] = resultado.data;
  }

  return filtros as FiltrosOrganizaciones;
}

/** Los filtros de vuelta a parámetros de dirección, para construir enlaces. */
export function parametrosDeOrganizaciones(filtros: FiltrosOrganizaciones): Record<string, string> {
  return filtros.q ? { q: filtros.q } : {};
}
