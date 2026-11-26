import ExcelJS from "exceljs";

import { columnasDe } from "@/lib/organizaciones/columnas-importacion";
import { MAXIMO_FILAS_ORGANIZACIONES } from "@/lib/organizaciones/importacion-organizaciones";
import { ETIQUETA_TIPO, type TipoOrganizacion } from "@/validators/organizacion-admin";

/** Nombre con el que se descarga cada plantilla. */
export function nombrePlantillaOrganizaciones(tipo: TipoOrganizacion): string {
  return `plantilla-${tipo}.xlsx`;
}

/** Nombre de la hoja de datos, que es la que lee el importador. */
export function hojaDePlantilla(tipo: TipoOrganizacion): string {
  return tipo === "asociaciones" ? "Asociaciones" : "Clubes";
}

const ANCHOS_ASOCIACIONES = [40, 14, 56, 44, 44, 30, 16, 40, 46, 34, 34, 34];
const ANCHOS_CLUBES = [34, 56, 44, 30, 16, 40, 46, 34, 34, 34];

/**
 * Fila de ejemplo de cada plantilla.
 *
 * Datos evidentemente ficticios: su trabajo es mostrar el formato del teléfono,
 * del correo y de los enlaces. Quien llena la hoja la borra y escribe encima.
 */
const EJEMPLO_ASOCIACION = [
  "Asociación de Estudiantes de Ejemplo",
  "AEEJ",
  "Representamos al estudiantado de la carrera y organizamos sus actividades académicas.",
  "Acompañar al estudiantado en su formación.",
  "Ser el puente entre el estudiantado y la facultad.",
  "aeej@uvg.edu.gt",
  "5555 4444",
  "Oficina 3 del edificio A, de 9 a 12.",
  "https://drive.google.com/file/d/EJEMPLO/view?usp=sharing",
  "https://instagram.com/aeej",
  "https://facebook.com/aeej",
  "",
];

const EJEMPLO_CLUB = [
  "Club de Ejemplo",
  "Espacio abierto a cualquier estudiante que quiera aprender y competir.",
  "Entrenamientos los martes y torneos internos cada mes.",
  "clubejemplo@uvg.edu.gt",
  "5555 4444",
  "Nos reunimos en el gimnasio del campus.",
  "https://drive.google.com/file/d/EJEMPLO/view?usp=sharing",
  "https://instagram.com/clubejemplo",
  "",
  "",
];

/** Explicación de cada columna, para la hoja de instrucciones. */
function indicaciones(tipo: TipoOrganizacion): [string, string][] {
  const propias: [string, string][] =
    tipo === "asociaciones"
      ? [
          ["Nombre completo", "Nombre oficial, entre 3 y 160 caracteres. No puede repetirse."],
          [
            "Siglas",
            "Obligatorias: entre 2 y 30 caracteres. Es el nombre corto con el que se conoce a la asociación (AEBIO) y con el que aparece en las tarjetas.",
          ],
          ["Descripción", "Quiénes son y a qué se dedican. Hasta 5000 caracteres."],
          ["Misión", "Opcional. Hasta 2000 caracteres."],
          ["Visión", "Opcional. Hasta 2000 caracteres."],
        ]
      : [
          ["Nombre", "Nombre del club, entre 3 y 160 caracteres. No puede repetirse."],
          ["Descripción", "Qué es el club y a quién está dirigido. Hasta 5000 caracteres."],
          ["Actividades", "Opcional. Qué hacen y cada cuánto. Hasta 2000 caracteres."],
        ];

  return [
    ...propias,
    ["Correo", "Correo de contacto. Hace falta el correo o el teléfono: al menos uno de los dos."],
    ["Teléfono", "Ocho dígitos, como 5555 4444."],
    ["Información de contacto", "Opcional. Dónde encontrarlos, horarios de oficina."],
    [
      "Enlace de la imagen",
      "Opcional. Enlace del logotipo en Drive, OneDrive o Dropbox, compartido como “cualquiera con el enlace”. La plataforma lo descarga al cargar el archivo y lo guarda; después el enlace ya no hace falta.",
    ],
    [
      "Instagram, Facebook y Sitio web",
      "Opcionales. El enlace completo, empezando con https://. Se publican como las redes del grupo.",
    ],
  ];
}

/**
 * Plantilla de Excel para cargar asociaciones o clubes.
 *
 * Los encabezados salen de la misma lista que usa el importador, así que la
 * plantilla no puede quedarse desalineada. La junta directiva y los integrantes
 * no van en el archivo: son una lista por cada grupo y se agregan desde la
 * ficha, en el panel.
 */
export async function generarPlantillaOrganizaciones(tipo: TipoOrganizacion): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma AEUVG";
  libro.created = new Date();

  const columnas = columnasDe(tipo);
  const anchos = tipo === "asociaciones" ? ANCHOS_ASOCIACIONES : ANCHOS_CLUBES;

  const hoja = libro.addWorksheet(hojaDePlantilla(tipo));
  hoja.columns = columnas.map((titulo, indice) => ({ header: titulo, width: anchos[indice] }));
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.getRow(1).font = { bold: true };
  hoja.addRow(tipo === "asociaciones" ? EJEMPLO_ASOCIACION : EJEMPLO_CLUB);

  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { header: "Columna", width: 32 },
    { header: "Qué se escribe", width: 96 },
  ];
  instrucciones.getRow(1).font = { bold: true };
  instrucciones.addRows(indicaciones(tipo));
  instrucciones.addRow([]);
  instrucciones.addRow([
    "Límites",
    `Hasta ${MAXIMO_FILAS_ORGANIZACIONES} filas por archivo y 5 MB de tamaño.`,
  ]);
  instrucciones.addRow([
    "Repetidos",
    `Si ya existe una ${ETIQUETA_TIPO[tipo].singular} con el mismo nombre${tipo === "asociaciones" ? " o las mismas siglas" : ""}, la fila se omite y solo se crean las nuevas. Puedes volver a cargar el mismo archivo sin duplicar nada.`,
  ]);
  instrucciones.addRow([
    "Junta directiva",
    "No va en este archivo. Los integrantes se agregan desde la ficha de cada grupo, en el panel.",
  ]);
  instrucciones.addRow([
    "Antes de cargar",
    `Borra la fila de ejemplo de la hoja “${hojaDePlantilla(tipo)}”. El panel revisa el archivo y muestra las filas con problemas antes de guardar nada.`,
  ]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
