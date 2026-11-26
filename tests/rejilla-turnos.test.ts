import assert from "node:assert/strict";
import test from "node:test";

import { claveDeBloque, construirRejillaTurnos } from "@/lib/prestamo-batas/rejilla-turnos";
import type { DiaSemana } from "@prisma/client";

/**
 * La cuadrícula del horario del salón.
 *
 * Los turnos se guardan sueltos y aquí se reacomodan como un horario: las horas
 * en las filas y los días en las columnas. Lo que importa es que las filas
 * salgan en orden de reloj, que solo aparezcan los días que abren y que un
 * bloque que únicamente existe un día no invente turnos en los demás.
 */

function turno(dia: DiaSemana, horaInicio: string, horaFin: string, idTurno = 0) {
  return { idTurno, dia, horaInicio, horaFin };
}

test("los bloques salen en orden de reloj aunque los turnos lleguen revueltos", () => {
  const rejilla = construirRejillaTurnos([
    turno("MARTES", "12:00", "15:00"),
    turno("LUNES", "06:45", "09:00"),
    turno("LUNES", "09:00", "12:00"),
  ]);

  assert.deepEqual(
    rejilla.bloques.map((bloque) => bloque.clave),
    ["06:45-09:00", "09:00-12:00", "12:00-15:00"]
  );
  assert.equal(rejilla.bloques[0].etiqueta, "06:45 a 09:00");
});

test("las columnas son los días que abren, en orden de la semana", () => {
  const rejilla = construirRejillaTurnos([
    turno("SABADO", "07:00", "10:00"),
    turno("MARTES", "09:00", "12:00"),
    turno("LUNES", "09:00", "12:00"),
  ]);

  assert.deepEqual(
    rejilla.columnas.map((columna) => columna.dia),
    ["LUNES", "MARTES", "SABADO"]
  );
  assert.deepEqual(
    rejilla.columnas.map((columna) => columna.etiqueta),
    ["Lunes", "Martes", "Sábado"]
  );
});

test("un día sin turnos no aparece como columna", () => {
  const rejilla = construirRejillaTurnos([turno("LUNES", "09:00", "12:00")]);

  assert.deepEqual(
    rejilla.columnas.map((columna) => columna.dia),
    ["LUNES"]
  );
});

test("cada casilla devuelve el turno de ese día a esa hora", () => {
  const lunes = turno("LUNES", "09:00", "12:00", 1);
  const martes = turno("MARTES", "09:00", "12:00", 2);
  const rejilla = construirRejillaTurnos([lunes, martes]);

  assert.equal(rejilla.celda("LUNES", claveDeBloque("09:00", "12:00"))?.idTurno, 1);
  assert.equal(rejilla.celda("MARTES", claveDeBloque("09:00", "12:00"))?.idTurno, 2);
});

test("el bloque que solo existe un día deja vacías las demás casillas de su fila", () => {
  // El sábado se abre a las 7:00 y entre semana a las 6:45: la fila del sábado
  // no puede inventar un turno el lunes.
  const rejilla = construirRejillaTurnos([
    turno("LUNES", "06:45", "09:00", 1),
    turno("SABADO", "07:00", "10:00", 2),
  ]);

  assert.equal(rejilla.bloques.length, 2);
  assert.equal(rejilla.celda("LUNES", claveDeBloque("07:00", "10:00")), null);
  assert.equal(rejilla.celda("SABADO", claveDeBloque("06:45", "09:00")), null);
});

test("los turnos de un día salen de la primera hora a la última", () => {
  const rejilla = construirRejillaTurnos([
    turno("LUNES", "15:00", "18:00", 3),
    turno("LUNES", "06:45", "09:00", 1),
    turno("LUNES", "09:00", "12:00", 2),
  ]);

  assert.deepEqual(
    rejilla.turnosDe("LUNES").map((t) => t.idTurno),
    [1, 2, 3]
  );
  assert.deepEqual(rejilla.turnosDe("JUEVES"), []);
});

test("sin turnos no hay columnas ni bloques", () => {
  const rejilla = construirRejillaTurnos([]);

  assert.deepEqual(rejilla.columnas, []);
  assert.deepEqual(rejilla.bloques, []);
});
