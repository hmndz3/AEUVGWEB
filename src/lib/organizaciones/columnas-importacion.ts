import type { TipoOrganizacion } from "@/validators/organizacion-admin";

/**
 * Columnas de las plantillas de asociaciones y de clubes.
 *
 * Son dos listas y no una porque las fichas no piden lo mismo: una asociación
 * tiene siglas, misión y visión, y un club, las actividades que realiza. Las
 * tres últimas columnas son iguales en las dos: las redes con las que cada
 * grupo se da a conocer.
 */
export const COLUMNAS_ASOCIACIONES = [
  "Nombre completo",
  "Siglas",
  "Descripción",
  "Misión",
  "Visión",
  "Correo",
  "Teléfono",
  "Información de contacto",
  "Enlace de la imagen",
  "Instagram",
  "Facebook",
  "Sitio web",
] as const;

export const COLUMNAS_CLUBES = [
  "Nombre",
  "Descripción",
  "Actividades",
  "Correo",
  "Teléfono",
  "Información de contacto",
  "Enlace de la imagen",
  "Instagram",
  "Facebook",
  "Sitio web",
] as const;

export type ColumnaOrganizacion =
  (typeof COLUMNAS_ASOCIACIONES)[number] | (typeof COLUMNAS_CLUBES)[number];

export function columnasDe(tipo: TipoOrganizacion): readonly ColumnaOrganizacion[] {
  return tipo === "asociaciones" ? COLUMNAS_ASOCIACIONES : COLUMNAS_CLUBES;
}

/**
 * Nombres con los que puede venir cada columna.
 *
 * El primero es el de la plantilla; los demás, las formas en las que la gente
 * nombra lo mismo. Se comparan normalizados, así que las mayúsculas y los
 * acentos no importan.
 */
export const ALIAS_COLUMNAS_ORGANIZACION = {
  "Nombre completo": ["nombre completo", "nombre", "nombre oficial", "asociacion"],
  Nombre: ["nombre", "nombre del club", "club"],
  Siglas: ["siglas", "nombre corto", "abreviatura", "acronimo"],
  Descripción: ["descripcion", "quienes somos", "detalle", "acerca de"],
  Misión: ["mision"],
  Visión: ["vision"],
  Actividades: ["actividades", "que hacemos", "que actividades realizan"],
  Correo: ["correo", "correo electronico", "email", "correo de contacto"],
  Teléfono: ["telefono", "numero de telefono", "celular", "whatsapp"],
  "Información de contacto": [
    "informacion de contacto",
    "contacto",
    "otros medios de contacto",
    "donde nos encuentran",
  ],
  "Enlace de la imagen": [
    "enlace de la imagen",
    "imagen",
    "logotipo",
    "logo",
    "enlace del logotipo",
    "url de la imagen",
  ],
  Instagram: ["instagram", "ig"],
  Facebook: ["facebook", "fb", "pagina de facebook"],
  "Sitio web": ["sitio web", "pagina web", "web", "sitio"],
} as const satisfies Record<ColumnaOrganizacion, readonly string[]>;

/**
 * Columnas sin las que el archivo no puede leerse.
 *
 * Solo el nombre: el resto de la ficha puede completarse después desde el
 * panel, y exigir la misión de cada club convertiría la carga en un trámite.
 * Las siglas de una asociación sí son obligatorias, pero eso lo comprueba el
 * esquema fila por fila, que es donde se puede decir en qué fila faltan.
 */
export function columnasObligatorias(tipo: TipoOrganizacion): readonly ColumnaOrganizacion[] {
  return tipo === "asociaciones" ? ["Nombre completo"] : ["Nombre"];
}

/** Plataformas que la plantilla trae como columna propia. */
export const COLUMNAS_REDES = [
  { columna: "Instagram", plataforma: "Instagram" },
  { columna: "Facebook", plataforma: "Facebook" },
  { columna: "Sitio web", plataforma: "Sitio web" },
] as const satisfies readonly { columna: ColumnaOrganizacion; plataforma: string }[];
