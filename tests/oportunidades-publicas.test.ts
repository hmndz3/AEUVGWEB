import assert from "node:assert/strict";
import test from "node:test";

import {
  condicionesOportunidadesPublicas,
  hoyEnGuatemala,
  MAXIMO_OPORTUNIDADES_PUBLICAS,
  ORDEN_OPORTUNIDADES_PUBLICAS,
} from "../src/lib/horas-beca/consultas-oportunidades-publicas";
import { formatearHorarioOportunidad } from "../src/lib/horas-beca/horario-oportunidad";
import { ESTADOS_OPORTUNIDAD } from "../src/validators/oportunidad-admin";

test("el día de hoy se calcula en la zona de Guatemala y no en la del servidor", () => {
  // Las 20:00 de Guatemala del 2 de noviembre son las 02:00 UTC del 3: tomar el
  // día en UTC retiraría esa misma noche las convocatorias de hoy.
  assert.equal(
    hoyEnGuatemala(new Date("2026-11-03T02:00:00.000Z")).toISOString(),
    "2026-11-02T00:00:00.000Z"
  );
  assert.equal(
    hoyEnGuatemala(new Date("2026-11-02T06:00:00.000Z")).toISOString(),
    "2026-11-02T00:00:00.000Z"
  );
  assert.equal(
    hoyEnGuatemala(new Date("2026-11-03T00:30:00.000Z")).toISOString(),
    "2026-11-02T00:00:00.000Z"
  );
});

test("la consulta pública pide solo las publicadas", () => {
  const condiciones = condicionesOportunidadesPublicas(new Date("2026-11-02T18:00:00.000Z"));

  assert.equal(condiciones.estado, "PUBLICADA");
  // Ningún otro estado entra: un borrador es trabajo a medias y una cancelada
  // ya no se va a realizar.
  for (const estado of ESTADOS_OPORTUNIDAD.filter((valor) => valor !== "PUBLICADA")) {
    assert.notEqual(condiciones.estado, estado);
  }
});

test("la convocatoria del propio día sigue apareciendo y la de ayer no", () => {
  const condiciones = condicionesOportunidadesPublicas(new Date("2026-11-02T22:00:00.000Z"));
  const corte = (condiciones.fecha as { gte: Date }).gte;

  assert.equal(corte.toISOString(), "2026-11-02T00:00:00.000Z");
  assert.ok(new Date("2026-11-02T00:00:00.000Z").getTime() >= corte.getTime());
  assert.ok(new Date("2026-11-03T00:00:00.000Z").getTime() >= corte.getTime());
  assert.equal(new Date("2026-11-01T00:00:00.000Z").getTime() >= corte.getTime(), false);
});

test("el orden pone lo más próximo primero y desempata sin ambigüedad", () => {
  assert.deepEqual(ORDEN_OPORTUNIDADES_PUBLICAS, [
    { fecha: "asc" },
    { horaInicio: "asc" },
    { idOportunidad: "asc" },
  ]);
});

test("la sección trae un tope de convocatorias por petición", () => {
  assert.ok(MAXIMO_OPORTUNIDADES_PUBLICAS > 0);
  assert.equal(Number.isSafeInteger(MAXIMO_OPORTUNIDADES_PUBLICAS), true);
});

test("el horario de la convocatoria se presenta con sus dos horas", () => {
  assert.equal(formatearHorarioOportunidad("08:00", "12:00"), "08:00 a 12:00");
});
