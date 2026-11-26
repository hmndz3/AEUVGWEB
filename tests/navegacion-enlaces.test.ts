import assert from "node:assert/strict";
import test from "node:test";

import { enlaceActivo, enlacesVisibles } from "../src/components/layout/enlaces-navegacion";
import { ROLES } from "../src/lib/auth/roles";

const PANEL_VOLUNTARIO = "/prestamo-batas/panel";

function textos(roles: Parameters<typeof enlacesVisibles>[0]): string[] {
  return enlacesVisibles(roles).map((enlace) => enlace.texto);
}

test("mientras no se resuelve la sesión solo se ven los enlaces públicos", () => {
  const visibles = textos(null);

  assert.ok(visibles.includes("Batas"));
  assert.ok(!visibles.includes("Salón de batas"));
  assert.ok(!visibles.includes("Panel"));
});

test("el estudiante ve la sección pública de batas pero no la del voluntario", () => {
  const visibles = textos([ROLES.estudiante]);

  assert.ok(visibles.includes("Batas"));
  assert.ok(!visibles.includes("Salón de batas"));
});

test("al voluntario se le habilita su pestaña del salón", () => {
  const visibles = enlacesVisibles([ROLES.estudiante, ROLES.voluntario]);
  const panel = visibles.find((enlace) => enlace.href === PANEL_VOLUNTARIO);

  assert.ok(panel, "el voluntario debe ver su pestaña");
  assert.equal(panel.texto, "Salón de batas");
});

test("quien deja de ser voluntario pierde la pestaña", () => {
  assert.ok(!textos([ROLES.estudiante]).includes("Salón de batas"));
});

test("la pestaña del voluntario no se le concede al administrador por serlo", () => {
  const visibles = textos([ROLES.administrador]);

  assert.ok(visibles.includes("Panel"));
  assert.ok(!visibles.includes("Salón de batas"));
});

test("en el panel del voluntario se marca su pestaña y no la sección pública", () => {
  const visibles = enlacesVisibles([ROLES.voluntario]);

  assert.equal(enlaceActivo(visibles, PANEL_VOLUNTARIO), PANEL_VOLUNTARIO);
});

test("en la sección pública de batas se marca esa y no el panel del voluntario", () => {
  const visibles = enlacesVisibles([ROLES.voluntario]);

  assert.equal(enlaceActivo(visibles, "/prestamo-batas"), "/prestamo-batas");
});

test("inicio solo se marca en la raíz, no en cualquier ruta", () => {
  const visibles = enlacesVisibles([ROLES.estudiante]);

  assert.equal(enlaceActivo(visibles, "/"), "/");
  assert.equal(enlaceActivo(visibles, "/eventos"), "/eventos");
});

test("una ruta sin enlace propio no marca ninguna pestaña", () => {
  assert.equal(enlaceActivo(enlacesVisibles([ROLES.estudiante]), "/iniciar-sesion"), null);
});
