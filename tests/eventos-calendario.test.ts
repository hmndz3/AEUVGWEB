import assert from "node:assert/strict";
import test from "node:test";

import {
  agruparEventosPorDia,
  construirCalendario,
  normalizarAncla,
  normalizarVista,
  periodoAnterior,
  periodoSiguiente,
} from "../src/lib/eventos/calendario";
import type { EventoResumen } from "../src/lib/eventos/consultas-eventos";

const HOY = new Date("2026-09-22T18:00:00.000Z");

function evento(idEvento: number, inicio: string, fin: string): EventoResumen {
  return {
    idEvento,
    nombre: `Evento ${idEvento}`,
    fechaInicio: new Date(inicio),
    fechaFin: new Date(fin),
    ubicacion: "Campus central",
    imagenUrl: null,
    destacado: false,
    estado: "PUBLICADO",
    tipoActividad: "OTRO",
    categoria: { idCategoriaEvento: 1, nombre: "Festival", color: "#5A35E8" },
    organizadores: [],
  };
}

test("la vista mensual arranca en domingo y cubre semanas completas", () => {
  const calendario = construirCalendario("mes", "2026-09-22", HOY);

  assert.equal(calendario.dias.length % 7, 0);
  assert.equal(calendario.dias[0].clave, "2026-08-30");
  assert.equal(calendario.dias[calendario.dias.length - 1].clave, "2026-10-03");
});

test("los días de relleno quedan marcados como ajenos al mes", () => {
  const calendario = construirCalendario("mes", "2026-09-22", HOY);

  assert.equal(calendario.dias[0].delPeriodo, false);
  assert.equal(calendario.dias.find((dia) => dia.clave === "2026-09-01")?.delPeriodo, true);
  assert.equal(calendario.dias.find((dia) => dia.clave === "2026-09-30")?.delPeriodo, true);
});

test("el día de hoy se identifica dentro de la grilla", () => {
  const calendario = construirCalendario("mes", "2026-09-22", HOY);
  const hoy = calendario.dias.filter((dia) => dia.esHoy);

  assert.equal(hoy.length, 1);
  assert.equal(hoy[0].clave, "2026-09-22");
});

test("un mes que empieza en domingo no agrega relleno al inicio", () => {
  const calendario = construirCalendario("mes", "2026-11-10", HOY);

  assert.equal(calendario.dias[0].clave, "2026-11-01");
  assert.equal(calendario.dias[0].delPeriodo, true);
});

test("la vista semanal tiene siete días y empieza en domingo", () => {
  const calendario = construirCalendario("semana", "2026-09-22", HOY);

  assert.equal(calendario.dias.length, 7);
  assert.equal(calendario.dias[0].clave, "2026-09-20");
  assert.equal(calendario.dias[6].clave, "2026-09-26");
  assert.ok(calendario.dias.every((dia) => dia.delPeriodo));
});

test("el rango consultado cubre la grilla completa en hora de Guatemala", () => {
  const calendario = construirCalendario("semana", "2026-09-22", HOY);

  assert.equal(calendario.desde.toISOString(), "2026-09-20T06:00:00.000Z");
  assert.equal(calendario.hasta.toISOString(), "2026-09-27T05:59:59.999Z");
});

test("el título nombra el mes o el rango de la semana", () => {
  assert.match(construirCalendario("mes", "2026-09-22", HOY).titulo, /2026/);
  assert.match(construirCalendario("semana", "2026-09-22", HOY).titulo, /al/);
});

test("navegar por meses no se desborda al final del mes", () => {
  assert.equal(periodoSiguiente("mes", "2026-01-31"), "2026-02-01");
  assert.equal(periodoAnterior("mes", "2026-03-31"), "2026-02-01");
  assert.equal(periodoSiguiente("mes", "2026-12-15"), "2027-01-01");
});

test("navegar por semanas avanza y retrocede siete días", () => {
  assert.equal(periodoSiguiente("semana", "2026-09-22"), "2026-09-29");
  assert.equal(periodoAnterior("semana", "2026-09-22"), "2026-09-15");
});

test("un ancla inválida se reemplaza por el día de hoy", () => {
  assert.equal(normalizarAncla("no-es-fecha", HOY), "2026-09-22");
  assert.equal(normalizarAncla("2026-02-30", HOY), "2026-09-22");
  assert.equal(normalizarAncla(undefined, HOY), "2026-09-22");
  assert.equal(normalizarAncla("2027-04-12", HOY), "2027-04-12");
});

test("cualquier vista distinta de semana se resuelve como mes", () => {
  assert.equal(normalizarVista("semana"), "semana");
  assert.equal(normalizarVista("mes"), "mes");
  assert.equal(normalizarVista("agenda"), "mes");
  assert.equal(normalizarVista(undefined), "mes");
});

test("un evento de un día aparece solo en su día", () => {
  const { dias } = construirCalendario("mes", "2026-09-22", HOY);
  const agrupados = agruparEventosPorDia(
    [evento(1, "2026-09-22T15:00:00.000Z", "2026-09-22T18:00:00.000Z")],
    dias
  );

  assert.equal(agrupados.size, 1);
  assert.equal(agrupados.get("2026-09-22")?.length, 1);
});

test("un evento de varios días aparece en todos los que abarca", () => {
  const { dias } = construirCalendario("mes", "2026-09-22", HOY);
  const agrupados = agruparEventosPorDia(
    [evento(1, "2026-09-21T15:00:00.000Z", "2026-09-23T23:00:00.000Z")],
    dias
  );

  assert.deepEqual([...agrupados.keys()].sort(), ["2026-09-21", "2026-09-22", "2026-09-23"]);
});

test("un evento fuera de la grilla no se agrupa", () => {
  const { dias } = construirCalendario("semana", "2026-09-22", HOY);
  const agrupados = agruparEventosPorDia(
    [evento(1, "2027-04-12T15:00:00.000Z", "2027-04-12T18:00:00.000Z")],
    dias
  );

  assert.equal(agrupados.size, 0);
});

test("varios eventos del mismo día se acumulan en su lista", () => {
  const { dias } = construirCalendario("mes", "2026-09-22", HOY);
  const agrupados = agruparEventosPorDia(
    [
      evento(1, "2026-09-22T15:00:00.000Z", "2026-09-22T18:00:00.000Z"),
      evento(2, "2026-09-22T20:00:00.000Z", "2026-09-22T22:00:00.000Z"),
    ],
    dias
  );

  assert.deepEqual(
    agrupados.get("2026-09-22")?.map((item) => item.idEvento),
    [1, 2]
  );
});

test("un evento de madrugada cuenta en el día local y no en el siguiente UTC", () => {
  const { dias } = construirCalendario("mes", "2026-09-22", HOY);
  // 22:00 del 22 en Guatemala son las 04:00 del 23 en UTC.
  const agrupados = agruparEventosPorDia(
    [evento(1, "2026-09-23T04:00:00.000Z", "2026-09-23T05:00:00.000Z")],
    dias
  );

  assert.deepEqual([...agrupados.keys()], ["2026-09-22"]);
});
