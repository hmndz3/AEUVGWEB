/**
 * Columnas de la plantilla de cursos.
 *
 * El catálogo de cursos es lo más simple que se carga por archivo: el código
 * con el que el curso aparece en el pensum y su nombre. AEUVG ya tiene esa
 * lista en una hoja, así que la plantilla la copia tal cual en vez de pedir
 * datos que nadie lleva.
 */
export const COLUMNAS_CURSOS = ["Código", "Nombre del curso"] as const;

export type ColumnaCurso = (typeof COLUMNAS_CURSOS)[number];

/**
 * Nombres con los que puede venir cada columna.
 *
 * El primero es el de la plantilla; los demás son las formas en que la gente
 * nombra lo mismo. "Id" está porque así se llama la columna en la hoja que
 * AEUVG usa hoy. Se comparan normalizados: ni mayúsculas ni acentos importan.
 */
export const ALIAS_COLUMNAS_CURSO = {
  Código: ["codigo", "id", "codigo del curso", "clave", "codigo de curso", "sigla"],
  "Nombre del curso": ["nombre del curso", "nombre", "curso", "descripcion", "nombre de curso"],
} as const satisfies Record<ColumnaCurso, readonly string[]>;

/** Sin estas dos columnas el archivo no puede leerse. */
export const COLUMNAS_OBLIGATORIAS_CURSO: readonly ColumnaCurso[] = COLUMNAS_CURSOS;
