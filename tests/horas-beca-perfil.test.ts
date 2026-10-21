import assert from "node:assert/strict";
import test from "node:test";

import { formatearFechaActividad, formatearHoras } from "../src/lib/horas-beca/formato-horas";
import { calcularTotalesHoras } from "../src/lib/horas-beca/totales-horas";

const registro = (cantidadHoras: number, estado: "PENDIENTE" | "ACREDITADA") => ({
  cantidadHoras,
  estado,
});

test("sin registros todos los totales quedan en cero", () => {
  assert.deepEqual(calcularTotalesHoras([]), {
    realizadas: 0,
    acreditadas: 0,
    pendientes: 0,
    actividades: 0,
  });
});

test("los totales separan las horas acreditadas de las pendientes", () => {
  const totales = calcularTotalesHoras([
    registro(2, "ACREDITADA"),
    registro(3, "ACREDITADA"),
    registro(2.5, "PENDIENTE"),
  ]);

  assert.deepEqual(totales, {
    realizadas: 7.5,
    acreditadas: 5,
    pendientes: 2.5,
    actividades: 3,
  });
});

test("las horas realizadas son la suma de las dos columnas", () => {
  const totales = calcularTotalesHoras([registro(1.25, "ACREDITADA"), registro(0.75, "PENDIENTE")]);

  assert.equal(totales.realizadas, totales.acreditadas + totales.pendientes);
  assert.equal(totales.realizadas, 2);
});

/*
 * Las cantidades vienen de una columna Decimal(6,2). Sumarlas en coma flotante
 * da 2.9999999999999996 para treinta registros de 0.1, que en pantalla se leería
 * como 3 pero descuadraría contra el resumen del panel, que suma en la base.
 */
test("la suma no arrastra error de coma flotante", () => {
  const registros = Array.from({ length: 30 }, () => registro(0.1, "ACREDITADA"));

  assert.equal(calcularTotalesHoras(registros).acreditadas, 3);
});

test("sumar medias horas da un total exacto", () => {
  const registros = Array.from({ length: 7 }, () => registro(0.5, "PENDIENTE"));

  assert.equal(calcularTotalesHoras(registros).pendientes, 3.5);
});

test("un estudiante con todo acreditado no tiene horas pendientes", () => {
  const totales = calcularTotalesHoras([registro(4, "ACREDITADA"), registro(2, "ACREDITADA")]);

  assert.equal(totales.pendientes, 0);
  assert.equal(totales.acreditadas, 6);
});

test("las horas se presentan sin decimales de adorno", () => {
  assert.equal(formatearHoras(2), "2");
  assert.equal(formatearHoras(2.5), "2.5");
  assert.equal(formatearHoras(2.25), "2.25");
  assert.equal(formatearHoras(0), "0");
  assert.equal(formatearHoras(10.5), "10.5");
});

/*
 * La fecha de la actividad es un día de calendario que PostgreSQL entrega como
 * la medianoche en UTC. Formatearla en la zona de Guatemala la correría al día
 * anterior y el estudiante vería una actividad del 9 fechada el 8.
 */
test("la fecha de la actividad se presenta en su día de calendario", () => {
  const texto = formatearFechaActividad(new Date("2026-10-09T00:00:00.000Z"));

  assert.match(texto, /9/);
  assert.match(texto, /2026/);
  assert.equal(texto.includes("8"), false);
});

test("el primer día del mes no se corre al mes anterior", () => {
  const texto = formatearFechaActividad(new Date("2026-11-01T00:00:00.000Z"));

  assert.match(texto, /1/);
  assert.equal(texto.toLowerCase().includes("oct"), false);
});
