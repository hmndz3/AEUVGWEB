/**
 * Nombres con los que se presenta una organización.
 *
 * Las asociaciones registran su nombre completo y, opcionalmente, sus siglas o
 * un nombre corto, que es como las conoce el estudiantado (AEUVG, AECCTIUVG).
 * Los clubes no tienen siglas, así que en ellos las dos funciones devuelven el
 * nombre tal cual.
 */
type ConNombre = { nombre: string; siglas: string | null };

/** El nombre corto cuando existe; si no, el completo. Para títulos y espacios reducidos. */
export function nombreCorto(organizacion: ConNombre): string {
  return organizacion.siglas ?? organizacion.nombre;
}

/** "AECCTIUVG — Asociación de…", para las listas de selección del panel y los filtros. */
export function nombreConSiglas(organizacion: ConNombre): string {
  return organizacion.siglas
    ? `${organizacion.siglas} — ${organizacion.nombre}`
    : organizacion.nombre;
}
