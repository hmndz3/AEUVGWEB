import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * Contraste del modo oscuro.
 *
 * En modo oscuro --color-texto se vuelve casi blanco, así que usarlo como
 * fondo con texto blanco encima —o como color de texto sobre un blanco fijo—
 * deja letras del mismo color que su fondo. Es lo que pasaba en el pie de
 * página, en la barra del panel y en las fichas de los eventos. Para esos dos
 * casos existe --color-contraste, que se queda oscuro en los dos temas.
 */

const RAIZ = join(import.meta.dirname, "..", "src");

function archivosTsx(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return archivosTsx(ruta);
    return entrada.name.endsWith(".tsx") ? [ruta] : [];
  });
}

/** Las listas de clases que trae un archivo, una por atributo className. */
function listasDeClases(contenido: string): string[] {
  return [...contenido.matchAll(/className=(?:"([^"]*)"|\{"([^"]*)"|'([^']*)')/g)].map(
    (coincidencia) => coincidencia[1] ?? coincidencia[2] ?? coincidencia[3] ?? ""
  );
}

const clasesPorArchivo = archivosTsx(RAIZ).map(
  (ruta) => [ruta, listasDeClases(readFileSync(ruta, "utf8"))] as const
);

test("hay archivos que revisar", () => {
  assert.ok(clasesPorArchivo.length > 50, "no se encontraron los componentes");
});

test("ningún fondo usa el color del texto con letras blancas encima", () => {
  for (const [ruta, listas] of clasesPorArchivo) {
    for (const clases of listas) {
      const malo = /\bbg-texto\b/.test(clases) && /\btext-white\b/.test(clases);
      assert.equal(malo, false, `${ruta} usa bg-texto con text-white: usa bg-contraste`);
    }
  }
});

test("ningún texto sobre un blanco fijo usa el color del tema", () => {
  for (const [ruta, listas] of clasesPorArchivo) {
    for (const clases of listas) {
      const malo = /\bbg-white\b/.test(clases) && /\btext-texto\b/.test(clases);
      assert.equal(malo, false, `${ruta} usa text-texto sobre bg-white: usa text-contraste`);
    }
  }
});

test("ningún acento claro lleva el color del texto encima", () => {
  // Ámbar, lima y turquesa son claros: en oscuro, --color-texto casi blanco
  // sobre ellos no se lee.
  for (const [ruta, listas] of clasesPorArchivo) {
    for (const clases of listas) {
      const malo = /\bbg-(ambar|lima|turquesa)\b/.test(clases) && /\btext-texto\b/.test(clases);
      assert.equal(malo, false, `${ruta} usa text-texto sobre un acento claro: usa text-contraste`);
    }
  }
});

test("el color de contraste existe en los dos temas y no es el mismo", () => {
  const css = readFileSync(join(RAIZ, "app", "globals.css"), "utf8");

  const claro = css.match(/@theme\s*\{[\s\S]*?--color-contraste:\s*(#[0-9a-f]{6})/i)?.[1];
  const oscuro = css.match(/data-tema="oscuro"\][\s\S]*?--color-contraste:\s*(#[0-9a-f]{6})/i)?.[1];

  assert.ok(claro, "falta --color-contraste en el tema claro");
  assert.ok(oscuro, "falta --color-contraste en el tema oscuro");
  assert.notEqual(claro, oscuro);
});
