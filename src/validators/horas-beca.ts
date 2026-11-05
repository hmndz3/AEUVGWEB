import { z } from "zod";

/** Longitud mínima del texto de búsqueda; con menos, cualquier registro coincide. */
export const MINIMO_BUSQUEDA_HORAS = 2;
export const MAXIMO_BUSQUEDA_HORAS = 80;

export const ESTADOS_HORA_BECA = ["PENDIENTE", "ACREDITADA"] as const;

export type EstadoHoraBecaFiltro = (typeof ESTADOS_HORA_BECA)[number];

export const ETIQUETAS_ESTADO_HORA_BECA: Record<EstadoHoraBecaFiltro, string> = {
  PENDIENTE: "Pendiente",
  ACREDITADA: "Acreditada",
};

/**
 * Registros con cuenta vinculada o sin ella. Es el filtro que le dice a AEUVG a
 * qué carnets les falta registrarse en la plataforma.
 */
export const VINCULOS_HORA_BECA = ["vinculados", "sin-cuenta"] as const;

export type VinculoHoraBeca = (typeof VINCULOS_HORA_BECA)[number];

export const ETIQUETAS_VINCULO_HORA_BECA: Record<VinculoHoraBeca, string> = {
  vinculados: "Con cuenta vinculada",
  "sin-cuenta": "Sin cuenta vinculada",
};

const identificador = z.coerce.number().int().positive();
const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Filtros del panel de horas beca. Cada campo se valida por separado porque la
 * dirección la escribe cualquiera: un parámetro con basura no debe tumbar la
 * pantalla, solo descartarse, con el mismo criterio que los filtros de eventos.
 */
export const esquemaFiltrosHorasBeca = z.object({
  q: z.string().trim().min(MINIMO_BUSQUEDA_HORAS).max(MAXIMO_BUSQUEDA_HORAS),
  estado: z.enum(ESTADOS_HORA_BECA),
  desde: fechaIso,
  hasta: fechaIso,
  vinculo: z.enum(VINCULOS_HORA_BECA),
  facultad: identificador,
  pagina: identificador,
});

export type FiltrosHorasBeca = Partial<z.infer<typeof esquemaFiltrosHorasBeca>>;

type ValorCrudo = string | string[] | undefined;

function primerValor(valor: ValorCrudo): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  return texto && texto.length > 0 ? texto : undefined;
}

/**
 * Interpreta los parámetros de la dirección quedándose solo con los válidos. Un
 * filtro mal escrito se ignora en silencio: el panel presenta el listado sin ese
 * filtro en lugar de una pantalla de error.
 */
export function interpretarFiltrosHorasBeca(
  parametros: Record<string, ValorCrudo> | URLSearchParams
): FiltrosHorasBeca {
  const leer = (clave: string): string | undefined =>
    parametros instanceof URLSearchParams
      ? (parametros.get(clave) ?? undefined) || undefined
      : primerValor(parametros[clave]);

  const filtros: Record<string, unknown> = {};

  for (const [clave, regla] of Object.entries(esquemaFiltrosHorasBeca.shape)) {
    const crudo = leer(clave);
    if (crudo === undefined) continue;

    const resultado = regla.safeParse(clave === "estado" ? crudo.toUpperCase() : crudo);
    if (resultado.success) filtros[clave] = resultado.data;
  }

  const validados = filtros as FiltrosHorasBeca;

  // Un rango invertido no filtra nada útil; se conserva la fecha de inicio.
  if (validados.desde && validados.hasta && validados.desde > validados.hasta) {
    delete validados.hasta;
  }

  return validados;
}

/** Cantidad de filtros activos, sin contar la página. */
export function contarFiltrosHoras(filtros: FiltrosHorasBeca): number {
  return Object.entries(filtros).filter(
    ([clave, valor]) => clave !== "pagina" && valor !== undefined
  ).length;
}

/** Los filtros de vuelta a parámetros de dirección, para construir enlaces. */
export function parametrosDeFiltrosHoras(filtros: FiltrosHorasBeca): Record<string, string> {
  const parametros: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(filtros)) {
    if (clave === "pagina" || valor === undefined) continue;
    parametros[clave] = String(valor);
  }

  return parametros;
}

/**
 * Periodo del reporte, tomado de la dirección.
 *
 * Reutiliza la interpretación del listado y se queda solo con las fechas: el
 * resumen del programa no admite los demás filtros, porque un total con el
 * estado ya filtrado dejaría la columna de pendientes en cero y se leería como
 * un dato y no como un filtro.
 */
export function interpretarFiltrosReporte(
  parametros: Record<string, ValorCrudo> | URLSearchParams
): Pick<FiltrosHorasBeca, "desde" | "hasta"> {
  const { desde, hasta } = interpretarFiltrosHorasBeca(parametros);

  return { desde, hasta };
}

/** Formatos en los que se puede descargar el listado de horas beca. */
export const FORMATOS_EXPORTACION = ["csv", "excel", "pdf"] as const;

export type FormatoExportacion = (typeof FORMATOS_EXPORTACION)[number];

export const ETIQUETAS_FORMATO: Record<FormatoExportacion, string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
};

/**
 * Formato pedido en la dirección, o null si no se reconoce. No hay formato por
 * omisión a propósito: descargar algo distinto de lo que se pidió confunde más
 * que un error.
 */
export function interpretarFormato(valor: string | null): FormatoExportacion | null {
  return FORMATOS_EXPORTACION.find((formato) => formato === valor) ?? null;
}
