import ExcelJS from "exceljs";

import { COLUMNAS_CURSOS } from "@/lib/tutorias/columnas-importacion-cursos";
import { MAXIMO_FILAS_CURSOS } from "@/lib/tutorias/importacion-cursos";

export const NOMBRE_PLANTILLA_CURSOS = "plantilla-cursos.xlsx";

/** Nombre de la hoja de datos, que es la que lee el importador. */
export const HOJA_CURSOS = "Cursos";

/**
 * Filas de ejemplo.
 *
 * Son cursos reales del pensum para que se vea de un vistazo qué forma tiene un
 * código. Quien llena la hoja las borra y escribe encima.
 */
const EJEMPLOS = [
  ["MM1101", "Matemática básica 1"],
  ["CC2005", "Algoritmos y estructuras de datos"],
];

/**
 * Plantilla de Excel para cargar el catálogo de cursos.
 *
 * Los encabezados salen de la misma lista que usa el importador, así que la
 * plantilla no puede quedarse desalineada con lo que la página espera leer.
 */
export async function generarPlantillaCursos(): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const hoja = libro.addWorksheet(HOJA_CURSOS);
  hoja.columns = COLUMNAS_CURSOS.map((titulo, indice) => ({
    header: titulo,
    width: indice === 0 ? 16 : 56,
  }));
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };
  hoja.addRows(EJEMPLOS);

  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { header: "Columna", width: 24 },
    { header: "Qué se escribe", width: 96 },
  ];
  instrucciones.getRow(1).font = { bold: true };
  instrucciones.addRows([
    [
      "Código",
      "El código del curso en el pensum: letras, números y guiones, hasta 30 caracteres. Se guarda en mayúsculas y sin espacios, así que «mm 1101» y «MM1101» son el mismo curso.",
    ],
    ["Nombre del curso", "Entre 3 y 160 caracteres."],
  ]);
  instrucciones.addRow([]);
  instrucciones.addRow(["Límites", `Hasta ${MAXIMO_FILAS_CURSOS} filas por archivo y 5 MB.`]);
  instrucciones.addRow([
    "Repetidos",
    "Si ya existe un curso con ese código, la fila se omite y solo se crean los nuevos. Puedes volver a cargar el mismo archivo cuando le agregues cursos sin duplicar los de antes.",
  ]);
  instrucciones.addRow([
    "Nombres distintos",
    "Si el código ya existe con otro nombre, se conserva el que está guardado y el reporte lo señala. Cambiar el nombre de un curso se hace desde el catálogo.",
  ]);
  instrucciones.addRow([
    "Antes de cargar",
    `Borra las filas de ejemplo de la hoja “${HOJA_CURSOS}”. El panel revisa el archivo y muestra las filas con problemas antes de guardar nada.`,
  ]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
