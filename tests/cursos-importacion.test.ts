import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { leerFilasDeCursos } from "@/lib/tutorias/importacion-cursos";
import { generarPlantillaCursos, HOJA_CURSOS } from "@/lib/tutorias/plantilla-cursos";
import type { CreadorDeCursos } from "@/lib/tutorias/servicio-importacion-cursos";
import { ServicioImportacionCursos } from "@/lib/tutorias/servicio-importacion-cursos";
import type { ResultadoCurso } from "@/lib/tutorias/servicio-cursos";
import { validarFilasDeCursos } from "@/lib/tutorias/validacion-importacion-cursos";
import type { DatosCursoAdmin } from "@/validators/tutoria";

/**
 * Carga del catálogo de cursos desde un Excel.
 *
 * Lo que se prueba es lo que AEUVG va a hacer de verdad: subir la hoja que ya
 * lleva, volver a subirla cuando le agregue cursos y que no se le dupliquen.
 */

async function hojaDeCursos(
  filas: unknown[][],
  encabezados = ["Código", "Nombre del curso"]
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Cursos");
  hoja.addRow(encabezados);
  for (const fila of filas) hoja.addRow(fila);

  return Buffer.from(await libro.xlsx.writeBuffer());
}

function filaCruda(fila: number, codigo: string, nombre: string) {
  return { fila, codigo, nombre };
}

/** Creador que guarda en memoria, para probar el servicio sin base de datos. */
class CursosEnMemoria implements CreadorDeCursos {
  readonly guardados: DatosCursoAdmin[] = [];
  fallaCon: string | null = null;

  async crear(datos: DatosCursoAdmin): Promise<ResultadoCurso> {
    if (this.fallaCon === datos.codigo) {
      return { tipo: "invalido", errores: { codigo: "Ya existe un curso con ese código." } };
    }

    this.guardados.push(datos);

    return { tipo: "guardado", idCurso: this.guardados.length };
  }
}

// ---------------------------------------------------------------------------
// Lectura del archivo
// ---------------------------------------------------------------------------

test("lee las filas de la hoja con las dos columnas", async () => {
  const lectura = await leerFilasDeCursos(
    await hojaDeCursos([
      ["MM1101", "Matemática básica 1"],
      ["CC2005", "Algoritmos"],
    ])
  );

  assert.equal(lectura.tipo, "leido");
  assert.equal(lectura.tipo === "leido" && lectura.filas.length, 2);
  assert.equal(lectura.tipo === "leido" && lectura.filas[0].codigo, "MM1101");
});

test("acepta la columna llamada Id, que es como la tienen hoy", async () => {
  const lectura = await leerFilasDeCursos(
    await hojaDeCursos([["MM1101", "Matemática básica 1"]], ["ID", "Nombre"])
  );

  assert.equal(lectura.tipo, "leido");
  assert.equal(lectura.tipo === "leido" && lectura.filas[0].nombre, "Matemática básica 1");
});

test("avisa cuál columna falta en lugar de leer a medias", async () => {
  const lectura = await leerFilasDeCursos(await hojaDeCursos([["MM1101"]], ["Código", "Créditos"]));

  assert.equal(lectura.tipo, "sin_columnas");
  assert.deepEqual(lectura.tipo === "sin_columnas" && lectura.faltantes, ["Nombre del curso"]);
});

test("las filas vacías del final de la hoja no cuentan", async () => {
  const lectura = await leerFilasDeCursos(
    await hojaDeCursos([
      ["MM1101", "Matemática básica 1"],
      ["", ""],
      [null, null],
    ])
  );

  assert.equal(lectura.tipo === "leido" && lectura.filas.length, 1);
});

test("un archivo que no es Excel se reporta como ilegible", async () => {
  const lectura = await leerFilasDeCursos(Buffer.from("esto no es un libro de Excel"));

  assert.equal(lectura.tipo, "ilegible");
});

test("la plantilla trae la hoja de cursos y se puede volver a leer", async () => {
  const lectura = await leerFilasDeCursos(await generarPlantillaCursos());

  assert.equal(lectura.tipo, "leido");
  // Las dos filas de ejemplo de la plantilla.
  assert.equal(lectura.tipo === "leido" && lectura.filas.length, 2);
  assert.equal(HOJA_CURSOS, "Cursos");
});

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

test("el código se guarda en mayúsculas y sin espacios", () => {
  const validacion = validarFilasDeCursos(
    [filaCruda(2, " mm 1101 ", "  Matemática   básica 1 ")],
    new Map()
  );

  assert.equal(validacion.validas.length, 1);
  assert.equal(validacion.validas[0].datos.codigo, "MM1101");
  assert.equal(validacion.validas[0].datos.nombre, "Matemática básica 1");
});

test("una fila sin nombre se reporta con su número y su campo", () => {
  const validacion = validarFilasDeCursos([filaCruda(4, "MM1101", "ok")], new Map());

  assert.equal(validacion.validas.length, 0);
  assert.equal(validacion.errores[0].fila, 4);
  assert.equal(validacion.errores[0].campo, "Nombre del curso");
});

test("un código con caracteres que no existen en el pensum da error", () => {
  const validacion = validarFilasDeCursos(
    [filaCruda(2, "MM/1101", "Matemática básica 1")],
    new Map()
  );

  assert.equal(validacion.errores[0].campo, "Código");
});

test("un curso que ya está en el catálogo se omite, no se duplica", () => {
  const validacion = validarFilasDeCursos(
    [filaCruda(2, "MM1101", "Matemática básica 1")],
    new Map([["MM1101", "Matemática básica 1"]])
  );

  assert.equal(validacion.validas.length, 0);
  assert.equal(validacion.repetidas.length, 1);
  assert.match(validacion.repetidas[0].mensaje, /no se creó otro/);
});

test("si el nombre guardado es otro, se conserva y el reporte lo dice", () => {
  const validacion = validarFilasDeCursos(
    [filaCruda(2, "MM1101", "Mate 1")],
    new Map([["MM1101", "Matemática básica 1"]])
  );

  assert.equal(validacion.validas.length, 0);
  assert.match(validacion.repetidas[0].mensaje, /Matemática básica 1/);
});

test("el mismo código repetido dentro del archivo entra una sola vez", () => {
  const validacion = validarFilasDeCursos(
    [filaCruda(2, "MM1101", "Matemática básica 1"), filaCruda(3, "mm1101", "Matemática básica 1")],
    new Map()
  );

  assert.equal(validacion.validas.length, 1);
  assert.equal(validacion.repetidas.length, 1);
  assert.equal(validacion.repetidas[0].fila, 3);
});

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

test("revisar no guarda nada y dice cuántas filas entrarían", async () => {
  const cursos = new CursosEnMemoria();
  const servicio = new ServicioImportacionCursos(
    { registrados: async () => new Map([["MM1101", "Matemática básica 1"]]) },
    cursos
  );

  const resultado = await servicio.revisar(
    await hojaDeCursos([
      ["MM1101", "Matemática básica 1"],
      ["CC2005", "Algoritmos"],
    ])
  );

  assert.equal(resultado.tipo, "revisado");
  assert.equal(resultado.tipo === "revisado" && resultado.correctas, 1);
  assert.equal(resultado.tipo === "revisado" && resultado.repetidas.length, 1);
  assert.equal(cursos.guardados.length, 0);
});

test("importar crea solo los cursos nuevos", async () => {
  const cursos = new CursosEnMemoria();
  const servicio = new ServicioImportacionCursos(
    { registrados: async () => new Map([["MM1101", "Matemática básica 1"]]) },
    cursos
  );

  const resultado = await servicio.importar(
    await hojaDeCursos([
      ["MM1101", "Matemática básica 1"],
      ["CC2005", "Algoritmos"],
    ])
  );

  assert.equal(resultado.tipo, "importado");
  assert.equal(resultado.tipo === "importado" && resultado.guardadas, 1);
  assert.deepEqual(
    cursos.guardados.map((curso) => curso.codigo),
    ["CC2005"]
  );
});

test("un curso que falla al guardarse no impide los demás", async () => {
  const cursos = new CursosEnMemoria();
  cursos.fallaCon = "CC2005";
  const servicio = new ServicioImportacionCursos({ registrados: async () => new Map() }, cursos);

  const resultado = await servicio.importar(
    await hojaDeCursos([
      ["CC2005", "Algoritmos"],
      ["MM1101", "Matemática básica 1"],
    ])
  );

  assert.equal(resultado.tipo === "importado" && resultado.guardadas, 1);
  assert.equal(resultado.tipo === "importado" && resultado.fallidas, 1);
  assert.deepEqual(
    cursos.guardados.map((curso) => curso.codigo),
    ["MM1101"]
  );
});

test("un archivo cuyos cursos ya existen todos no escribe nada", async () => {
  const cursos = new CursosEnMemoria();
  const servicio = new ServicioImportacionCursos(
    { registrados: async () => new Map([["MM1101", "Matemática básica 1"]]) },
    cursos
  );

  const resultado = await servicio.importar(
    await hojaDeCursos([["MM1101", "Matemática básica 1"]])
  );

  assert.equal(resultado.tipo, "sin_filas_nuevas");
  assert.equal(cursos.guardados.length, 0);
});
