import assert from "node:assert/strict";
import test from "node:test";

import { estadoVisible, etiquetaEstado, tonoEstado } from "../src/lib/eventos/estado-evento";
import { claveDiaLocal, formatearHora, formatearRango } from "../src/lib/eventos/formato-fechas";

function evento(
  estado: "PUBLICADO" | "BORRADOR" | "CANCELADO" | "FINALIZADO",
  inicio: string,
  fin: string
) {
  return { estado, fechaInicio: new Date(inicio), fechaFin: new Date(fin) } as const;
}

const AHORA = new Date("2026-09-15T18:00:00.000Z");

test("un evento publicado que aún no empieza está próximo", () => {
  const futuro = evento("PUBLICADO", "2026-10-01T15:00:00.000Z", "2026-10-01T18:00:00.000Z");

  assert.equal(estadoVisible(futuro, AHORA), "proximo");
});

test("un evento publicado que ya empezó y no ha terminado está en curso", () => {
  const enCurso = evento("PUBLICADO", "2026-09-15T14:00:00.000Z", "2026-09-15T22:00:00.000Z");

  assert.equal(estadoVisible(enCurso, AHORA), "en_curso");
});

test("un evento que empieza justo ahora ya cuenta como en curso", () => {
  const justoAhora = evento("PUBLICADO", "2026-09-15T18:00:00.000Z", "2026-09-15T20:00:00.000Z");

  assert.equal(estadoVisible(justoAhora, AHORA), "en_curso");
});

test("un evento publicado cuya fecha de fin ya pasó se muestra finalizado", () => {
  const pasado = evento("PUBLICADO", "2026-09-01T15:00:00.000Z", "2026-09-01T18:00:00.000Z");

  assert.equal(estadoVisible(pasado, AHORA), "finalizado");
});

test("la cancelación prevalece sobre las fechas", () => {
  const cancelado = evento("CANCELADO", "2026-10-01T15:00:00.000Z", "2026-10-01T18:00:00.000Z");

  assert.equal(estadoVisible(cancelado, AHORA), "cancelado");
});

test("un borrador no se presenta como próximo aunque su fecha sea futura", () => {
  const borrador = evento("BORRADOR", "2026-10-01T15:00:00.000Z", "2026-10-01T18:00:00.000Z");

  assert.equal(estadoVisible(borrador, AHORA), "borrador");
});

test("cada estado visible tiene etiqueta y tono definidos", () => {
  for (const estado of ["proximo", "en_curso", "finalizado", "cancelado", "borrador"] as const) {
    assert.ok(etiquetaEstado(estado).length > 0);
    assert.ok(tonoEstado(estado).length > 0);
  }
});

test("la clave del día usa la zona horaria de Guatemala y no la del sistema", () => {
  // 05:00 UTC son las 23:00 del día anterior en Guatemala.
  assert.equal(claveDiaLocal(new Date("2027-02-10T05:00:00.000Z")), "2027-02-09");
  assert.equal(claveDiaLocal(new Date("2027-02-10T06:00:00.000Z")), "2027-02-10");
});

test("la hora se muestra convertida a la hora local de Guatemala", () => {
  assert.match(formatearHora(new Date("2027-02-10T21:00:00.000Z")), /\b03\b/);
});

test("un evento de un solo día muestra una fecha y sus dos horas", () => {
  const rango = formatearRango(
    new Date("2027-02-10T15:00:00.000Z"),
    new Date("2027-02-10T18:00:00.000Z")
  );

  assert.equal(rango.includes(" a "), true);
  assert.equal(rango.split("·").length, 2);
});

test("un evento de varios días muestra la fecha de inicio y la de fin", () => {
  const rango = formatearRango(
    new Date("2027-04-12T14:00:00.000Z"),
    new Date("2027-04-14T23:00:00.000Z")
  );

  assert.match(rango, /12/);
  assert.match(rango, /14/);
});
