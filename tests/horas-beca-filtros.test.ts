import assert from "node:assert/strict";
import test from "node:test";

import { condicionesDeFiltrosHoras, diaCalendario } from "../src/lib/horas-beca/filtros-horas";
import {
  contarFiltrosHoras,
  interpretarFiltrosHorasBeca,
  parametrosDeFiltrosHoras,
} from "../src/validators/horas-beca";

test("los filtros válidos se interpretan con sus tipos", () => {
  const filtros = interpretarFiltrosHorasBeca({
    q: "ana",
    estado: "PENDIENTE",
    desde: "2026-10-01",
    hasta: "2026-10-31",
    vinculo: "sin-cuenta",
    pagina: "3",
  });

  assert.deepEqual(filtros, {
    q: "ana",
    estado: "PENDIENTE",
    desde: "2026-10-01",
    hasta: "2026-10-31",
    vinculo: "sin-cuenta",
    pagina: 3,
  });
});

test("un parámetro inválido se descarta sin tumbar la pantalla", () => {
  const filtros = interpretarFiltrosHorasBeca({
    q: "a",
    estado: "inventado",
    desde: "01/10/2026",
    vinculo: "ninguno",
    pagina: "-4",
  });

  assert.deepEqual(filtros, {});
});

test("el estado se acepta aunque venga en minúsculas", () => {
  assert.equal(interpretarFiltrosHorasBeca({ estado: "acreditada" }).estado, "ACREDITADA");
  assert.equal(interpretarFiltrosHorasBeca({ estado: "Pendiente" }).estado, "PENDIENTE");
});

test("un rango invertido conserva la fecha de inicio y descarta la de fin", () => {
  const filtros = interpretarFiltrosHorasBeca({ desde: "2026-10-31", hasta: "2026-10-01" });

  assert.equal(filtros.desde, "2026-10-31");
  assert.equal(filtros.hasta, undefined);
});

test("los parámetros repetidos se resuelven con el primero", () => {
  assert.equal(interpretarFiltrosHorasBeca({ q: ["ana", "carlos"] }).q, "ana");
});

test("los filtros se leen igual desde una cadena de consulta", () => {
  const filtros = interpretarFiltrosHorasBeca(
    new URLSearchParams("q=biblioteca&estado=ACREDITADA&pagina=2")
  );

  assert.deepEqual(filtros, { q: "biblioteca", estado: "ACREDITADA", pagina: 2 });
});

test("la página no cuenta como filtro activo", () => {
  assert.equal(contarFiltrosHoras({ pagina: 4 }), 0);
  assert.equal(contarFiltrosHoras({ pagina: 4, estado: "PENDIENTE", q: "ana" }), 2);
});

test("los enlaces de paginación conservan los filtros y no la página", () => {
  const parametros = parametrosDeFiltrosHoras({
    q: "ana",
    estado: "PENDIENTE",
    vinculo: "vinculados",
    pagina: 5,
  });

  assert.deepEqual(parametros, { q: "ana", estado: "PENDIENTE", vinculo: "vinculados" });
});

test("el buscador compara contra la copia normalizada del registro", () => {
  assert.deepEqual(condicionesDeFiltrosHoras({ q: "Música" }), {
    textoBusqueda: { contains: "musica" },
  });
  assert.deepEqual(condicionesDeFiltrosHoras({ q: "24089" }), {
    textoBusqueda: { contains: "24089" },
  });
});

test("sin filtros la consulta no agrega ninguna condición", () => {
  assert.deepEqual(condicionesDeFiltrosHoras({}), {});
});

test("el filtro de vínculo distingue los registros con y sin cuenta", () => {
  assert.deepEqual(condicionesDeFiltrosHoras({ vinculo: "vinculados" }), {
    idEstudiante: { not: null },
  });
  assert.deepEqual(condicionesDeFiltrosHoras({ vinculo: "sin-cuenta" }), { idEstudiante: null });
});

/*
 * La fecha de la actividad es un día de calendario sin hora. PostgreSQL la
 * compara contra la medianoche en UTC, así que el rango se construye en UTC: con
 * el desplazamiento de Guatemala quedarían fuera los registros del borde.
 */
test("el rango de fechas se construye sobre el día de calendario en UTC", () => {
  assert.equal(diaCalendario("2026-10-09").toISOString(), "2026-10-09T00:00:00.000Z");

  assert.deepEqual(condicionesDeFiltrosHoras({ desde: "2026-10-01", hasta: "2026-10-31" }), {
    fechaActividad: {
      gte: new Date("2026-10-01T00:00:00.000Z"),
      lte: new Date("2026-10-31T00:00:00.000Z"),
    },
  });
});

test("un rango abierto por un extremo solo aplica ese límite", () => {
  assert.deepEqual(condicionesDeFiltrosHoras({ desde: "2026-10-01" }), {
    fechaActividad: { gte: new Date("2026-10-01T00:00:00.000Z") },
  });
  assert.deepEqual(condicionesDeFiltrosHoras({ hasta: "2026-10-31" }), {
    fechaActividad: { lte: new Date("2026-10-31T00:00:00.000Z") },
  });
});

test("los filtros se combinan en una sola condición", () => {
  assert.deepEqual(
    condicionesDeFiltrosHoras({ q: "ana", estado: "ACREDITADA", vinculo: "vinculados" }),
    {
      textoBusqueda: { contains: "ana" },
      estado: "ACREDITADA",
      idEstudiante: { not: null },
    }
  );
});
