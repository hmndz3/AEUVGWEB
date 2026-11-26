import { normalizarTexto } from "@/lib/busqueda-texto";
import { TIPOS_ACTIVIDAD } from "@/validators/eventos";

/**
 * Columnas de la plantilla de eventos, en el orden en el que se presentan.
 *
 * Son las que pide el documento de funcionalidades para un evento: nombre,
 * descripción, fecha, hora, ubicación, organizador, categoría, imagen e
 * información adicional.
 */
export const COLUMNAS_IMPORTACION_EVENTOS = [
  "Nombre del evento",
  "Descripción",
  "Categoría",
  "Tipo de actividad",
  "Fecha de inicio",
  "Hora de inicio",
  "Fecha de fin",
  "Hora de fin",
  "Ubicación",
  "Organizador",
  "Cupo",
  "Información adicional",
  "Enlace de la imagen",
] as const;

export type ColumnaEvento = (typeof COLUMNAS_IMPORTACION_EVENTOS)[number];

/**
 * Nombres con los que puede venir cada columna.
 *
 * El primero es el de la plantilla. Los demás son las formas en las que la
 * gente nombra lo mismo al armar su propia hoja, porque quien llena esto es
 * cada organizador y no una sola persona con una sola costumbre.
 */
export const ALIAS_COLUMNAS_EVENTO = {
  "Nombre del evento": ["nombre del evento", "nombre", "evento", "actividad", "titulo"],
  Descripción: ["descripcion", "descripcion del evento", "detalle", "de que se trata"],
  Categoría: ["categoria", "categoria del evento", "tipo de evento"],
  "Tipo de actividad": ["tipo de actividad", "tipo", "clase de actividad"],
  "Fecha de inicio": ["fecha de inicio", "fecha", "fecha del evento", "fecha inicio", "dia"],
  "Hora de inicio": ["hora de inicio", "hora", "hora inicio", "inicio"],
  "Fecha de fin": ["fecha de fin", "fecha fin", "fecha de finalizacion", "fecha final"],
  "Hora de fin": ["hora de fin", "hora fin", "hora de finalizacion", "fin", "hora final"],
  Ubicación: ["ubicacion", "lugar", "donde", "sede", "salon"],
  Organizador: [
    "organizador",
    "organizadores",
    "asociacion",
    "club",
    "asociacion o club",
    "organiza",
  ],
  Cupo: ["cupo", "capacidad", "cupos", "numero de personas"],
  "Información adicional": [
    "informacion adicional",
    "informacion extra",
    "notas",
    "observaciones",
    "requisitos",
  ],
  "Enlace de la imagen": [
    "enlace de la imagen",
    "imagen",
    "enlace de imagen",
    "link de la imagen",
    "foto",
    "afiche",
    "url de la imagen",
  ],
} as const satisfies Record<ColumnaEvento, readonly string[]>;

/**
 * Columnas sin las que el archivo no puede leerse.
 *
 * La fecha de fin queda fuera: lo normal es que un evento empiece y termine el
 * mismo día, así que cuando no viene se toma la de inicio. Lo demás es lo que
 * el formulario del panel también exige.
 */
export const COLUMNAS_OBLIGATORIAS_EVENTO = [
  "Nombre del evento",
  "Descripción",
  "Categoría",
  "Fecha de inicio",
  "Hora de inicio",
  "Hora de fin",
  "Ubicación",
] as const satisfies readonly ColumnaEvento[];

/**
 * Cómo se escribe cada tipo de actividad en la hoja.
 *
 * En la plantilla van en español y con acento, que es como se leen en el panel;
 * el archivo puede traerlos en cualquier combinación de mayúsculas o sin
 * acentos, porque se comparan normalizados.
 */
const ALIAS_TIPO_ACTIVIDAD: Record<string, (typeof TIPOS_ACTIVIDAD)[number]> = {
  academica: "ACADEMICA",
  academico: "ACADEMICA",
  academia: "ACADEMICA",
  recreativa: "RECREATIVA",
  recreativo: "RECREATIVA",
  voluntariado: "VOLUNTARIADO",
  "servicio social": "VOLUNTARIADO",
  otro: "OTRO",
  otra: "OTRO",
};

/**
 * Tipo de actividad a partir de lo que diga la celda.
 *
 * Cuando la celda viene vacía se asume "Otro" en lugar de rechazar la fila: el
 * tipo sirve para filtrar la cartelera, y dejar fuera un evento entero por no
 * haber clasificado la actividad sería desproporcionado.
 */
export function interpretarTipoActividad(texto: string): (typeof TIPOS_ACTIVIDAD)[number] | null {
  const normalizado = normalizarTexto(texto);
  if (normalizado === "") return "OTRO";

  return ALIAS_TIPO_ACTIVIDAD[normalizado] ?? null;
}
