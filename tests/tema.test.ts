import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAVE_TEMA,
  DESCRIPCIONES_TEMA,
  ETIQUETAS_TEMA,
  esTema,
  GUION_TEMA,
  resolverTema,
  TEMAS,
} from "../src/lib/ui/tema";

test("solo se admiten los tres temas conocidos", () => {
  for (const tema of TEMAS) assert.equal(esTema(tema), true);

  for (const valor of ["", "azul", "OSCURO", null, undefined, 3]) {
    assert.equal(esTema(valor), false, `${String(valor)} no debería admitirse`);
  }
});

test("cada tema tiene su etiqueta y su explicación", () => {
  for (const tema of TEMAS) {
    assert.ok(ETIQUETAS_TEMA[tema], `falta la etiqueta de ${tema}`);
    assert.ok(DESCRIPCIONES_TEMA[tema], `falta la descripción de ${tema}`);
  }
});

test("el tema del dispositivo se resuelve contra su preferencia", () => {
  assert.equal(resolverTema("sistema", true), "oscuro");
  assert.equal(resolverTema("sistema", false), "claro");
});

test("un tema elegido a mano manda sobre el del dispositivo", () => {
  // Es la razón de que la preferencia no sea solo la media query: quien quiere
  // el sitio claro con el sistema en oscuro tiene que poder tenerlo.
  assert.equal(resolverTema("claro", true), "claro");
  assert.equal(resolverTema("oscuro", false), "oscuro");
});

test("el guion que corre antes de pintar no deja escapar un error", () => {
  // Si el almacenamiento está bloqueado, el guion no debe romper la página.
  assert.match(GUION_TEMA, /try\{/);
  assert.match(GUION_TEMA, /catch\(e\)\{\}/);
  assert.ok(GUION_TEMA.includes(JSON.stringify(CLAVE_TEMA)));
  assert.ok(GUION_TEMA.includes("prefers-color-scheme: dark"));
});

test("el guion aplica el tema sobre el documento y no sobre el cuerpo", () => {
  // Las variables de color cuelgan de :root, así que el atributo va ahí: en
  // el body no las alcanzaría.
  assert.match(GUION_TEMA, /documentElement\.dataset\.tema/);
});
