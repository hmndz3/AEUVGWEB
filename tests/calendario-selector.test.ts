import assert from "node:assert/strict";
import test from "node:test";

import {
  construirMes,
  DIAS_CORTOS,
  esDiaElegible,
  formatearHora12,
  horaDeMinutos,
  horasDisponibles,
  hoyEnGuatemala,
  minutosDeHora,
  nombreDelMes,
  partesDeIso,
  primerDiaElegible,
  type DiaDelMes,
} from "../src/lib/ui/calendario-selector";

const dia = (iso: string, diaSemana: number, delMes = true): DiaDelMes => ({
  iso,
  numero: Number(iso.slice(8)),
  delMes,
  diaSemana,
});

// ---------- Rejilla del mes ----------

test("la rejilla tiene seis semanas completas, siempre", () => {
  // El alto fijo evita que la pantalla salte al pasar de un mes a otro.
  for (const [anio, mes] of [
    [2026, 0],
    [2026, 1],
    [2026, 10],
    [2027, 1],
  ]) {
    assert.equal(construirMes(anio, mes).length, 42, `${anio}-${mes + 1}`);
  }
});

test("la rejilla empieza en lunes", () => {
  assert.equal(DIAS_CORTOS[0], "Lu");
  assert.equal(DIAS_CORTOS.length, 7);

  // El 1 de noviembre de 2026 es domingo, así que la primera casilla es el
  // lunes 26 de octubre y la rejilla arranca con seis días de relleno.
  const noviembre = construirMes(2026, 10);
  assert.equal(noviembre[0].iso, "2026-10-26");
  assert.equal(noviembre[0].diaSemana, 1);
  assert.equal(noviembre[0].delMes, false);
  assert.equal(noviembre[6].iso, "2026-11-01");
  assert.equal(noviembre[6].delMes, true);
});

test("un mes que empieza en lunes no lleva relleno al inicio", () => {
  // El 1 de junio de 2026 es lunes.
  const junio = construirMes(2026, 5);

  assert.equal(junio[0].iso, "2026-06-01");
  assert.equal(junio[0].delMes, true);
});

test("febrero bisiesto trae sus veintinueve días", () => {
  const febrero = construirMes(2028, 1).filter((casilla) => casilla.delMes);

  assert.equal(febrero.length, 29);
  assert.equal(febrero.at(-1)?.iso, "2028-02-29");
});

test("el mes se rotula en español", () => {
  assert.equal(nombreDelMes(2026, 10), "noviembre de 2026");
  assert.equal(nombreDelMes(2026, 0), "enero de 2026");
});

// ---------- Días elegibles ----------

test("los límites de fecha dejan fuera lo que está antes y después", () => {
  const limites = { minimo: "2026-11-10", maximo: "2026-11-20" };

  assert.equal(esDiaElegible(dia("2026-11-09", 1), limites), false);
  assert.equal(esDiaElegible(dia("2026-11-10", 2), limites), true);
  assert.equal(esDiaElegible(dia("2026-11-20", 5), limites), true);
  assert.equal(esDiaElegible(dia("2026-11-21", 6), limites), false);
});

test("los días permitidos dejan fuera el resto de la semana", () => {
  // Un tutor que solo atiende martes y jueves.
  const limites = { diasPermitidos: [2, 4] };

  assert.equal(esDiaElegible(dia("2026-11-17", 2), limites), true);
  assert.equal(esDiaElegible(dia("2026-11-19", 4), limites), true);
  assert.equal(esDiaElegible(dia("2026-11-18", 3), limites), false);
  assert.equal(esDiaElegible(dia("2026-11-21", 6), limites), false);
});

test("sin lista de días permitidos valen todos", () => {
  for (let diaSemana = 0; diaSemana < 7; diaSemana += 1) {
    assert.equal(esDiaElegible(dia("2026-11-17", diaSemana), {}), true);
  }
});

test("una lista vacía de días permitidos no deja elegir ninguno", () => {
  // Es el caso de una ficha de tutor sin franjas: no hay nada que agendar.
  assert.equal(esDiaElegible(dia("2026-11-17", 2), { diasPermitidos: [] }), false);
});

test("el primer día elegible salta hasta el siguiente que sirva", () => {
  // Desde el miércoles 18, con martes y jueves, el siguiente es el jueves 19.
  assert.equal(primerDiaElegible("2026-11-18", { diasPermitidos: [2, 4] }), "2026-11-19");
  // Desde el propio jueves, es ese mismo día.
  assert.equal(primerDiaElegible("2026-11-19", { diasPermitidos: [2, 4] }), "2026-11-19");
  // Cruza el cambio de mes sin tropezarse.
  assert.equal(primerDiaElegible("2026-11-28", { diasPermitidos: [2] }), "2026-12-01");
});

test("sin ningún día elegible no se inventa uno", () => {
  assert.equal(primerDiaElegible("2026-11-18", { diasPermitidos: [] }), null);
  assert.equal(
    primerDiaElegible("2026-11-18", { maximo: "2026-11-10" }),
    null,
    "un máximo ya pasado no deja nada por delante"
  );
});

// ---------- Fechas en texto ----------

test("una fecha mal formada no se interpreta", () => {
  assert.deepEqual(partesDeIso("2026-11-19"), { anio: 2026, mes: 10, dia: 19 });
  assert.equal(partesDeIso("19/11/2026"), null);
  assert.equal(partesDeIso("2026-11-9"), null);
  assert.equal(partesDeIso(""), null);
  // Existe como texto pero no en el calendario.
  assert.equal(partesDeIso("2026-02-31"), null);
});

test("el día de hoy se calcula en la zona del país", () => {
  // Las 20:00 del 2 de noviembre en Guatemala son las 02:00 del 3 en UTC.
  assert.equal(hoyEnGuatemala(new Date("2026-11-03T02:00:00.000Z")), "2026-11-02");
  assert.equal(hoyEnGuatemala(new Date("2026-11-03T06:00:00.000Z")), "2026-11-03");
});

// ---------- Horas ----------

test("las horas de reloj van y vienen de sus minutos", () => {
  assert.equal(minutosDeHora("00:00"), 0);
  assert.equal(minutosDeHora("14:30"), 870);
  assert.equal(minutosDeHora("23:59"), 1439);
  assert.equal(minutosDeHora("24:00"), null);
  assert.equal(minutosDeHora("9:00"), null);
  assert.equal(horaDeMinutos(870), "14:30");
  assert.equal(horaDeMinutos(0), "00:00");
});

test("las horas ofrecidas van del mínimo al máximo, con el máximo incluido", () => {
  // En una franja que termina a las 18:00, esa hora es un fin válido.
  assert.deepEqual(horasDisponibles(60, "14:00", "18:00"), [
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ]);
  assert.deepEqual(horasDisponibles(30, "14:00", "15:00"), ["14:00", "14:30", "15:00"]);
});

test("un rango invertido o un paso imposible no ofrecen nada", () => {
  assert.deepEqual(horasDisponibles(30, "18:00", "14:00"), []);
  assert.deepEqual(horasDisponibles(0, "14:00", "18:00"), []);
});

test("la hora se presenta en doce horas, como se lee en Guatemala", () => {
  assert.equal(formatearHora12("14:30"), "2:30 p.m.");
  assert.equal(formatearHora12("09:05"), "9:05 a.m.");
  assert.equal(formatearHora12("00:30"), "12:30 a.m.");
  assert.equal(formatearHora12("12:00"), "12:00 p.m.");
  assert.equal(formatearHora12("no es hora"), "no es hora");
});
