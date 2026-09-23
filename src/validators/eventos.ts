import { z } from "zod";

/** Longitud mínima del texto de búsqueda; con menos, cualquier evento coincide. */
export const MINIMO_BUSQUEDA = 2;
export const MAXIMO_BUSQUEDA = 80;

export const TIPOS_ACTIVIDAD = ["ACADEMICA", "RECREATIVA", "VOLUNTARIADO", "OTRO"] as const;

export const ETIQUETAS_TIPO_ACTIVIDAD: Record<(typeof TIPOS_ACTIVIDAD)[number], string> = {
  ACADEMICA: "Académica",
  RECREATIVA: "Recreativa",
  VOLUNTARIADO: "Voluntariado",
  OTRO: "Otro",
};

const identificador = z.coerce.number().int().positive();
const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Filtros del listado de eventos. Cada campo se valida por separado porque la
 * dirección la escribe cualquiera: un parámetro con basura no debe tumbar la
 * página, solo descartarse (ver interpretarFiltrosEventos).
 */
export const esquemaFiltrosEventos = z.object({
  q: z.string().trim().min(MINIMO_BUSQUEDA).max(MAXIMO_BUSQUEDA),
  desde: fechaIso,
  hasta: fechaIso,
  categoria: identificador,
  tipo: z.enum(TIPOS_ACTIVIDAD),
  asociacion: identificador,
  club: identificador,
  pagina: identificador,
});

export type FiltrosEventos = Partial<z.infer<typeof esquemaFiltrosEventos>>;

type ValorCrudo = string | string[] | undefined;

function primerValor(valor: ValorCrudo): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  return texto && texto.length > 0 ? texto : undefined;
}

/**
 * Interpreta los parámetros de la dirección quedándose solo con los válidos.
 * Un filtro mal escrito se ignora en silencio: el estudiante ve el listado sin
 * ese filtro en lugar de una pantalla de error.
 */
export function interpretarFiltrosEventos(
  parametros: Record<string, ValorCrudo> | URLSearchParams
): FiltrosEventos {
  const leer = (clave: string): string | undefined =>
    parametros instanceof URLSearchParams
      ? (parametros.get(clave) ?? undefined) || undefined
      : primerValor(parametros[clave]);

  const filtros: Record<string, unknown> = {};

  for (const [clave, regla] of Object.entries(esquemaFiltrosEventos.shape)) {
    const crudo = leer(clave);
    if (crudo === undefined) continue;

    const resultado = regla.safeParse(crudo);
    if (resultado.success) filtros[clave] = resultado.data;
  }

  const validados = filtros as FiltrosEventos;

  // Un rango invertido no filtra nada útil; se conserva la fecha de inicio.
  if (validados.desde && validados.hasta && validados.desde > validados.hasta) {
    delete validados.hasta;
  }

  return validados;
}

/** Cantidad de filtros activos, sin contar la página. */
export function contarFiltros(filtros: FiltrosEventos): number {
  return Object.entries(filtros).filter(
    ([clave, valor]) => clave !== "pagina" && valor !== undefined
  ).length;
}

/** Los filtros de vuelta a parámetros de dirección, para construir enlaces. */
export function parametrosDeFiltros(filtros: FiltrosEventos): Record<string, string> {
  const parametros: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(filtros)) {
    if (clave === "pagina" || valor === undefined) continue;
    parametros[clave] = String(valor);
  }

  return parametros;
}
