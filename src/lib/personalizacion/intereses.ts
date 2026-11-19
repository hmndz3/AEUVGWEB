/**
 * Tipos de interés que la plataforma registra.
 *
 * `interes_usuario` guarda una referencia polimórfica: el tipo dice a qué
 * tabla apunta `id_referencia`. Por eso la lista vive aquí y no como enum en
 * el esquema, y por eso no hay llave foránea.
 *
 * Viven en su propio módulo porque los usan tanto el servidor como las
 * pantallas: importarlos del módulo que consulta arrastraría el cliente de la
 * base al paquete del navegador.
 */
export const TIPOS_INTERES = {
  categoriaEvento: "categoria_evento",
  organizacion: "organizacion",
  curso: "curso",
} as const;

export type TipoInteres = (typeof TIPOS_INTERES)[keyof typeof TIPOS_INTERES];

/** Intereses que puede marcar una cuenta de un mismo tipo. */
export const MAXIMO_INTERESES = 12;

/**
 * Deja la selección en la forma en la que se guarda.
 *
 * Quita repetidos y lo que no puede ser un identificador, y corta en el
 * máximo. La selección llega de un formulario, así que no se confía en que
 * venga limpia.
 */
export function normalizarSeleccion(ids: readonly unknown[]): number[] {
  const limpios = ids.map((id) => Number(id)).filter((id) => Number.isSafeInteger(id) && id > 0);

  return [...new Set(limpios)].slice(0, MAXIMO_INTERESES);
}
