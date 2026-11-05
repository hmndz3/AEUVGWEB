import { normalizarTexto } from "@/lib/busqueda-texto";

/**
 * Nombres con los que puede venir cada columna del archivo.
 *
 * El primero de cada lista es el de la plantilla; los demás son los que usa
 * AEUVG en la hoja con la que lleva el control desde antes de la plataforma.
 * Exigir los nombres de la plantilla obligaría a reescribir los encabezados de
 * años de histórico, que es justo el trabajo que el importador viene a evitar.
 *
 * Se comparan normalizados —en minúsculas, sin acentos y con los espacios
 * colapsados—, así que "CARNÉ" y "Carne" son el mismo encabezado.
 */
export const ALIAS_COLUMNAS = {
  Carnet: ["carnet", "carne", "no de carnet", "numero de carnet"],
  "Nombre del estudiante": ["nombre del estudiante", "nombre completo", "nombre", "estudiante"],
  "Fecha de la actividad": ["fecha de la actividad", "fecha"],
  "Hora de inicio": ["hora de inicio", "hora inicio", "inicio"],
  "Hora de fin": ["hora de fin", "hora fin", "fin"],
  Actividad: [
    "actividad",
    "actividad de apoyo",
    "descripcion de la actividad",
    "descripcion",
    "tipo de actividad",
  ],
  "Cantidad de horas": [
    "cantidad de horas",
    "horas a acreditar",
    "horas acreditadas",
    "horas",
    "total de horas",
  ],
  Observaciones: ["observaciones", "observacion", "notas", "comentarios"],
} as const satisfies Record<string, readonly string[]>;

/**
 * Columna que trae el horario entero en una sola celda.
 *
 * La plantilla pide la hora de entrada y la de salida por separado, pero la
 * hoja de AEUVG las lleva juntas en "HORARIO DE APOYO". Se admiten las dos
 * formas: si están las dos columnas de hora se usan esas, y si no, se parte
 * esta.
 */
export const ALIAS_HORARIO = ["horario de apoyo", "horario", "horario de la actividad"];

/** Columnas que la hoja puede traer y el importador no necesita. */
export const COLUMNAS_IGNORADAS = ["correo", "correo uvg", "correo institucional", "email"];

/** Encabezado en la única forma en la que se compara. */
export function normalizarEncabezado(titulo: string): string {
  return normalizarTexto(titulo.replace(/[.:]/g, " "));
}

/**
 * Separadores con los que se escribe un rango de horas: un guion de cualquier
 * clase, "a" o "hasta".
 */
const SEPARADOR_HORARIO = /\s*(?:[-–—]|\ba\b|\bhasta\b)\s*/;

/**
 * Hora suelta a formato de 24 horas.
 *
 * Acepta "14:00", "9:00", "2:00 pm" y "2 pm", que son las formas en las que
 * aparece escrita a mano en las hojas. Devuelve null si no se reconoce, para
 * que la fila se reporte en lugar de guardarse con una hora inventada.
 */
export function aHora24(texto: string): string | null {
  const limpio = texto.trim().toLocaleLowerCase("es").replace(/\./g, "");
  const partes = limpio.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!partes) return null;

  let horas = Number(partes[1]);
  const minutos = partes[2] ?? "00";
  const meridiano = partes[3];

  if (meridiano === "pm" && horas < 12) horas += 12;
  if (meridiano === "am" && horas === 12) horas = 0;
  if (horas > 23 || Number(minutos) > 59) return null;

  return `${String(horas).padStart(2, "0")}:${minutos}`;
}

/**
 * Parte "14:00-16:00" en sus dos horas.
 *
 * Devuelve cadenas vacías cuando no se reconoce el rango: el esquema de
 * validación es el que rechaza la fila y explica el problema, de modo que el
 * reporte hable de horarios y no de expresiones regulares.
 */
export function partirHorario(texto: string): { inicio: string; fin: string } {
  const piezas = texto.trim().split(SEPARADOR_HORARIO).filter(Boolean);

  if (piezas.length !== 2) return { inicio: "", fin: "" };

  const inicio = aHora24(piezas[0]);
  const fin = aHora24(piezas[1]);

  // O se entienden las dos o ninguna: devolver media hora buena dejaría la
  // fila con un horario a medias que nadie escribió.
  if (inicio === null || fin === null) return { inicio: "", fin: "" };

  return { inicio, fin };
}
