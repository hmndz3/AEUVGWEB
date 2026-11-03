// Comprueba que la plantilla de Excel y el importador hablen del mismo archivo.
//
// Uso:
//   npm run horas:verificar-plantilla
//
// No toca la base: genera la plantilla en memoria y se la pasa al lector, que es
// la única forma de saber que las dos mitades siguen alineadas. La plantilla y el
// importador comparten la lista de columnas, pero compartir una constante no
// garantiza que el archivo que sale sea legible para el que entra.
import ExcelJS from "exceljs";

import {
  COLUMNAS_IMPORTACION,
  leerFilasDeExcel,
  MAXIMO_FILAS_IMPORTACION,
} from "../../src/lib/horas-beca/importacion";
import { generarPlantilla } from "../../src/lib/horas-beca/plantilla-importacion";
import { validarFilas } from "../../src/lib/horas-beca/validacion-importacion";

type Comprobacion = { nombre: string; bien: boolean; detalle?: string };

const comprobaciones: Comprobacion[] = [];

function comprobar(nombre: string, bien: boolean, detalle?: string): void {
  comprobaciones.push({ nombre, bien, detalle });
}

async function principal(): Promise<void> {
  const plantilla = await generarPlantilla();

  // Los encabezados que escribió la plantilla, leídos del archivo y no de la
  // constante: así se nota si la hoja sale con otra cosa.
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(plantilla as unknown as ArrayBuffer);

  const hoja = libro.worksheets[0];
  const encabezados: string[] = [];
  hoja.getRow(1).eachCell((celda) => encabezados.push(String(celda.value ?? "").trim()));

  comprobar(
    "La hoja de datos es la primera del libro",
    hoja.name === "Horas beca",
    `se llama "${hoja.name}"`
  );

  comprobar(
    "Los encabezados de la plantilla son los que espera el importador",
    encabezados.join("|") === COLUMNAS_IMPORTACION.join("|"),
    encabezados.join(", ")
  );

  const lectura = await leerFilasDeExcel(plantilla);

  comprobar(
    "El importador lee la plantilla sin reportar columnas faltantes",
    lectura.tipo === "leido",
    lectura.tipo === "sin_columnas" ? `faltan: ${lectura.faltantes.join(", ")}` : lectura.tipo
  );

  if (lectura.tipo === "leido") {
    comprobar(
      "La plantilla trae una sola fila de ejemplo",
      lectura.filas.length === 1,
      `trajo ${lectura.filas.length}`
    );

    const { validas, errores } = validarFilas(lectura.filas);

    comprobar(
      "La fila de ejemplo pasa la validación tal como viene",
      validas.length === 1 && errores.length === 0,
      errores.map((error) => `fila ${error.fila}: ${error.campo} — ${error.mensaje}`).join("; ")
    );

    if (validas.length === 1) {
      const { horarioApoyo, cantidadHoras } = validas[0].datos;
      comprobar(
        "El horario de ejemplo se arma con las dos columnas de hora",
        horarioApoyo === "14:00-16:00",
        horarioApoyo
      );
      comprobar(
        "La cantidad de horas de ejemplo se interpreta como número",
        cantidadHoras === 2.5,
        String(cantidadHoras)
      );
    }
  }

  comprobar(
    "La hoja de instrucciones explica todas las columnas",
    COLUMNAS_IMPORTACION.every((columna) =>
      libro.worksheets[1]
        ?.getColumn(1)
        .values.some((valor) => String(valor ?? "").trim() === columna)
    ),
    libro.worksheets[1]?.name ?? "no hay segunda hoja"
  );

  let fallos = 0;
  for (const { nombre, bien, detalle } of comprobaciones) {
    if (!bien) fallos += 1;
    console.log(`${bien ? "OK  " : "FALLA"}  ${nombre}${bien || !detalle ? "" : ` (${detalle})`}`);
  }

  console.log(
    `\nColumnas: ${COLUMNAS_IMPORTACION.length} · máximo de filas por archivo: ${MAXIMO_FILAS_IMPORTACION} · tamaño de la plantilla: ${plantilla.length} bytes`
  );

  if (fallos > 0) {
    console.error(`\n${fallos} comprobación(es) fallaron.`);
    process.exit(1);
  }

  console.log("\nLa plantilla y el importador usan las mismas columnas.");
}

principal().catch((error: unknown) => {
  console.error(
    "No se pudo verificar la plantilla:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
