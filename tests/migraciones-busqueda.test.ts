import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { normalizarTexto } from "../src/lib/busqueda-texto";

const CARPETA = path.join(import.meta.dirname, "..", "prisma", "migrations");

/**
 * Los dos juegos de caracteres de cada translate() de las migraciones: el de
 * letras acentuadas y el de sus reemplazos, que van siempre uno tras otro.
 */
function paresDeTranslate(): { archivo: string; desde: string; hacia: string }[] {
  const pares: { archivo: string; desde: string; hacia: string }[] = [];
  const patron = /'([^']*[áéíóúüñ][^']*)',\s*'([^']+)'/g;

  for (const entrada of readdirSync(CARPETA, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;

    const sql = readFileSync(path.join(CARPETA, entrada.name, "migration.sql"), "utf8");

    for (const coincidencia of sql.matchAll(patron)) {
      pares.push({ archivo: entrada.name, desde: coincidencia[1], hacia: coincidencia[2] });
    }
  }

  return pares;
}

/**
 * Migraciones que quedaron con los juegos desalineados y ya no pueden tocarse,
 * porque Prisma guarda la suma de verificación de lo aplicado. La migración
 * 20261007180000 vuelve a calcular la columna con el juego correcto, así que su
 * efecto está corregido; se dejan anotadas aquí para que la comprobación siga
 * valiendo para toda migración nueva.
 */
const DESALINEADAS_HISTORICAS = new Set([
  "20260917000000_add_texto_busqueda_evento",
  "20260925000000_add_texto_busqueda_organizaciones",
]);

/**
 * PostgreSQL alinea por posición los dos juegos de translate() y descarta los
 * caracteres del primero que no tengan pareja en el segundo. Con juegos de
 * distinto largo el reemplazo se desplaza en silencio: así fue como la "ñ"
 * terminó convertida en "a" en la carga inicial del texto de búsqueda.
 */
test("ninguna migración nueva desalinea los juegos de translate()", () => {
  const pares = paresDeTranslate();

  assert.ok(pares.length > 0, "no se encontró ningún translate() en las migraciones");

  const desalineados = pares
    .filter(({ archivo }) => !DESALINEADAS_HISTORICAS.has(archivo))
    .filter(({ desde, hacia }) => [...desde].length !== [...hacia].length)
    .map(({ archivo, desde, hacia }) => `${archivo}: ${[...desde].length} → ${[...hacia].length}`);

  assert.deepEqual(desalineados, []);
});

/**
 * La última migración que carga el texto de búsqueda es la que deja el valor
 * vigente, así que su mapeo debe coincidir con el de la aplicación, que es la
 * fuente de verdad y el que se aplica en cada guardado.
 */
test("el último mapeo de las migraciones coincide con el de la aplicación", () => {
  const pares = paresDeTranslate();
  const { desde, hacia } = pares[pares.length - 1];
  const reemplazos = [...hacia];

  for (const [indice, letra] of [...desde].entries()) {
    const esperado =
      letra === letra.toLowerCase() ? normalizarTexto(letra) : normalizarTexto(letra).toUpperCase();

    assert.equal(
      reemplazos[indice],
      esperado,
      `la migración convierte "${letra}" en "${reemplazos[indice]}" y la aplicación en "${esperado}"`
    );
  }
});
