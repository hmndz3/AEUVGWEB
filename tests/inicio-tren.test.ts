import assert from "node:assert/strict";
import test from "node:test";

import type { EventoResumen } from "../src/lib/eventos/consultas-eventos";
import { partesDeFecha } from "../src/lib/eventos/formato-fechas";
import { elegirEventosTren } from "../src/lib/inicio/consultas-inicio";

function evento(idEvento: number, fecha: string, destacado = false): EventoResumen {
  return {
    idEvento,
    nombre: `Evento ${idEvento}`,
    fechaInicio: new Date(fecha),
    fechaFin: new Date(fecha),
    ubicacion: "Plaza CIT",
    imagenUrl: null,
    destacado,
    estado: "PUBLICADO",
    tipoActividad: "ACADEMICA",
    categoria: { idCategoriaEvento: 1, nombre: "Festival", color: "#5A35E8" },
    organizadores: [],
  };
}

test("el tren da prioridad a los destacados aunque sean más lejanos", () => {
  const destacados = [evento(9, "2026-12-01T16:00:00Z", true)];
  const proximos = [
    evento(1, "2026-10-10T16:00:00Z"),
    evento(2, "2026-10-11T16:00:00Z"),
    evento(3, "2026-10-12T16:00:00Z"),
  ];

  const elegidos = elegirEventosTren(destacados, proximos, 3);

  assert.deepEqual(
    elegidos.map((e) => e.idEvento),
    [1, 2, 9]
  );
});

test("un evento destacado y próximo a la vez aparece una sola vez", () => {
  const destacado = evento(4, "2026-10-10T16:00:00Z", true);

  const elegidos = elegirEventosTren([destacado], [destacado, evento(5, "2026-10-11T16:00:00Z")]);

  assert.deepEqual(
    elegidos.map((e) => e.idEvento),
    [4, 5]
  );
});

test("el tren presenta los eventos en orden de fecha", () => {
  const elegidos = elegirEventosTren(
    [evento(7, "2026-11-20T16:00:00Z", true), evento(6, "2026-10-20T16:00:00Z", true)],
    [evento(8, "2026-10-15T16:00:00Z")]
  );

  assert.deepEqual(
    elegidos.map((e) => e.idEvento),
    [8, 6, 7]
  );
});

test("sin eventos el tren queda vacío", () => {
  assert.deepEqual(elegirEventosTren([], []), []);
});

test("las partes de la fecha usan la hora de Guatemala", () => {
  // 02:00 UTC del 14 de octubre todavía es 13 de octubre en Guatemala.
  const partes = partesDeFecha(new Date("2026-10-14T02:00:00Z"));

  assert.equal(partes.dia, "13");
  assert.equal(partes.mes.toLowerCase(), "oct");
  assert.equal(partes.diaSemana.toLowerCase(), "mar");
});
