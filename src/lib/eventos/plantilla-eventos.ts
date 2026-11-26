import ExcelJS from "exceljs";

import { COLUMNAS_IMPORTACION_EVENTOS } from "@/lib/eventos/columnas-importacion";
import { MAXIMO_FILAS_EVENTOS } from "@/lib/eventos/importacion-eventos";
import { ETIQUETAS_TIPO_ACTIVIDAD } from "@/validators/eventos";

/** Nombre con el que se descarga la plantilla. */
export const NOMBRE_PLANTILLA_EVENTOS = "plantilla-eventos.xlsx";

/** Hojas del libro. La de datos es la primera, que es la que lee el importador. */
export const HOJA_EVENTOS = "Eventos";
export const HOJA_LISTAS = "Listas";

/** Ancho de cada columna, en el orden de la plantilla. */
const ANCHOS = [34, 54, 24, 18, 14, 12, 14, 12, 30, 26, 8, 40, 46];

/** Listas con las que se llenan las columnas de catálogo. */
export type ListasPlantilla = {
  categorias: string[];
  organizadores: string[];
};

/**
 * Fila de ejemplo que acompaña a la plantilla.
 *
 * Va una sola, con datos evidentemente ficticios, porque su único trabajo es
 * mostrar el formato de la fecha, de la hora y del enlace de la imagen. Quien
 * llena la hoja la borra y escribe encima.
 */
const EJEMPLO = [
  "Feria de Emprendimiento UVG",
  "Exposición de proyectos de estudiantes de todas las facultades, con jurado y premiación al final de la jornada.",
  "Festival",
  "Académica",
  "2026-12-04",
  "09:00",
  "",
  "16:00",
  "Plaza central del campus",
  "AEUVG",
  200,
  "Opcional: requisitos, costo de entrada o a quién escribir.",
  "https://drive.google.com/file/d/EJEMPLO/view?usp=sharing",
];

/** Explicación de cada columna, para la hoja de instrucciones. */
function indicaciones(listas: ListasPlantilla): [string, string][] {
  return [
    ["Nombre del evento", "Entre 5 y 200 caracteres. Es el nombre con el que se verá publicado."],
    [
      "Descripción",
      "De qué se trata la actividad, entre 20 y 5000 caracteres. Es el texto que leerá el estudiantado.",
    ],
    [
      "Categoría",
      `Una de las de la hoja “${HOJA_LISTAS}”: ${listas.categorias.join(", ") || "consulta con AEUVG"}.`,
    ],
    [
      "Tipo de actividad",
      `Una de estas: ${Object.values(ETIQUETAS_TIPO_ACTIVIDAD).join(", ")}. Si se deja vacía se guarda como Otro.`,
    ],
    ["Fecha de inicio", "Día en que empieza, como 2026-12-04 o 04/12/2026."],
    ["Hora de inicio", "Hora de Guatemala, como 09:00."],
    ["Fecha de fin", "Solo si termina otro día. Vacía significa el mismo día que empieza."],
    ["Hora de fin", "Hora a la que termina. Debe ser posterior a la de inicio."],
    ["Ubicación", "Dónde se realiza: edificio, salón o dirección."],
    [
      "Organizador",
      "Nombre o siglas de la asociación o del club que organiza, de la hoja “Listas”. Si no es ninguno de los dos, escribe la unidad de UVG (una facultad, la biblioteca).",
    ],
    ["Cupo", "Opcional. Número de personas que caben."],
    ["Información adicional", "Opcional. Requisitos, costo, a quién escribir."],
    [
      "Enlace de la imagen",
      "Opcional. Enlace del afiche en Drive, OneDrive o Dropbox, compartido como “cualquiera con el enlace”. La plataforma descarga la imagen al cargar el archivo y la guarda; después el enlace ya no hace falta.",
    ],
  ];
}

/** Rango de una columna de la hoja de listas, para la lista desplegable. */
function rangoDeLista(columna: string, filas: number): string {
  return `'${HOJA_LISTAS}'!$${columna}$2:$${columna}$${filas + 1}`;
}

/**
 * Plantilla de Excel para cargar eventos.
 *
 * Los encabezados se toman de la misma lista que usa el importador, así que la
 * plantilla no puede quedarse desalineada: si se agrega o se renombra una
 * columna, las dos cosas cambian a la vez.
 *
 * Lleva una hoja con los catálogos de la plataforma, y las columnas de
 * categoría y de tipo quedan como lista desplegable. Es la diferencia entre que
 * cada organizador adivine cómo se llama una categoría y que la elija.
 */
export async function generarPlantillaEventos(listas: ListasPlantilla): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const hoja = libro.addWorksheet(HOJA_EVENTOS);

  hoja.columns = COLUMNAS_IMPORTACION_EVENTOS.map((titulo, indice) => ({
    header: titulo,
    width: ANCHOS[indice],
  }));

  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };
  hoja.addRow(EJEMPLO);

  const listado = libro.addWorksheet(HOJA_LISTAS);
  listado.columns = [
    { header: "Categorías", width: 30 },
    { header: "Tipos de actividad", width: 24 },
    { header: "Asociaciones y clubes", width: 40 },
  ];
  listado.getRow(1).font = { bold: true };

  const tipos = Object.values(ETIQUETAS_TIPO_ACTIVIDAD);
  const alto = Math.max(listas.categorias.length, tipos.length, listas.organizadores.length);

  for (let fila = 0; fila < alto; fila += 1) {
    listado.addRow([
      listas.categorias[fila] ?? "",
      tipos[fila] ?? "",
      listas.organizadores[fila] ?? "",
    ]);
  }

  // Listas desplegables en las dos columnas de catálogo. No bloquean la celda:
  // la hoja sigue sirviendo si AEUVG agrega una categoría después de que
  // alguien descargó la plantilla.
  for (let fila = 2; fila <= MAXIMO_FILAS_EVENTOS + 1; fila += 1) {
    if (listas.categorias.length > 0) {
      hoja.getCell(`C${fila}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [rangoDeLista("A", listas.categorias.length)],
        showErrorMessage: false,
      };
    }

    hoja.getCell(`D${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [rangoDeLista("B", tipos.length)],
      showErrorMessage: false,
    };
  }

  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { header: "Columna", width: 26 },
    { header: "Qué se escribe", width: 96 },
  ];
  instrucciones.getRow(1).font = { bold: true };
  instrucciones.addRows(indicaciones(listas));
  instrucciones.addRow([]);
  instrucciones.addRow([
    "Límites",
    `Hasta ${MAXIMO_FILAS_EVENTOS} eventos por archivo y 5 MB de tamaño.`,
  ]);
  instrucciones.addRow([
    "Eventos que ya pasaron",
    "Una fila cuya fecha de finalización ya pasó no se crea: se reporta para que la corrijas.",
  ]);
  instrucciones.addRow([
    "Eventos repetidos",
    "Si ya existe un evento con el mismo nombre en la misma fecha, la fila se omite y solo se crean los nuevos. Puedes volver a cargar el mismo archivo sin duplicar nada.",
  ]);
  instrucciones.addRow([
    "Antes de cargar",
    `Borra la fila de ejemplo de la hoja “${HOJA_EVENTOS}”. El panel revisa el archivo y muestra las filas con problemas antes de guardar nada.`,
  ]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
