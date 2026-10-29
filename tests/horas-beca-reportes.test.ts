import assert from "node:assert/strict";
import test from "node:test";

import {
  nombrarEstudiantes,
  plegarPorEstudiante,
  plegarPorMes,
  primeroDelMes,
  type GrupoHoras,
} from "../src/lib/horas-beca/calculos-reportes";
import { formatearMes } from "../src/lib/horas-beca/formato-horas";
import { interpretarFiltrosReporte } from "../src/validators/horas-beca";

const dia = (fecha: string): Date => new Date(`${fecha}T00:00:00.000Z`);

const grupoMes = (
  fecha: string,
  estado: GrupoHoras["estado"],
  horas: number,
  registros = 1
): GrupoHoras & { fechaActividad: Date } => ({
  fechaActividad: dia(fecha),
  estado,
  horas,
  registros,
});

const grupoCarnet = (
  carnet: string,
  estado: GrupoHoras["estado"],
  horas: number,
  registros = 1
): GrupoHoras & { carnet: string } => ({ carnet, estado, horas, registros });

test("el mes de un día de calendario se calcula en UTC", () => {
  // El primero de mes es el caso que delata una conversión a la zona del país:
  // en Guatemala serían las 18:00 del último día del mes anterior.
  assert.equal(primeroDelMes(dia("2026-10-01")).toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(primeroDelMes(dia("2026-10-31")).toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(formatearMes(primeroDelMes(dia("2026-10-01"))), "octubre de 2026");
});

test("los días del mismo mes se suman en una sola fila", () => {
  const meses = plegarPorMes([
    grupoMes("2026-10-09", "ACREDITADA", 2.5),
    grupoMes("2026-10-09", "PENDIENTE", 2),
    grupoMes("2026-10-21", "ACREDITADA", 1.5, 2),
  ]);

  assert.equal(meses.length, 1);
  assert.equal(meses[0].registros, 4);
  assert.equal(meses[0].horasTotales, 6);
  assert.equal(meses[0].horasAcreditadas, 4);
  assert.equal(meses[0].horasPendientes, 2);
});

test("los meses salen del más reciente al más antiguo", () => {
  const meses = plegarPorMes([
    grupoMes("2026-08-04", "ACREDITADA", 3),
    grupoMes("2026-11-02", "PENDIENTE", 1),
    grupoMes("2026-10-09", "ACREDITADA", 2),
  ]);

  assert.deepEqual(
    meses.map(({ mes }) => mes.toISOString().slice(0, 7)),
    ["2026-11", "2026-10", "2026-08"]
  );
});

test("sin grupos no hay meses, en lugar de un mes en cero", () => {
  assert.deepEqual(plegarPorMes([]), []);
});

test("las horas de un carnet se suman y se reparten por estado", () => {
  const estudiantes = plegarPorEstudiante(
    [
      grupoCarnet("24117", "ACREDITADA", 7.5, 3),
      grupoCarnet("24117", "PENDIENTE", 2.5, 1),
      grupoCarnet("24118", "PENDIENTE", 4, 2),
    ],
    10
  );

  assert.equal(estudiantes.length, 2);
  assert.equal(estudiantes[0].carnet, "24117");
  assert.equal(estudiantes[0].registros, 4);
  assert.equal(estudiantes[0].horasTotales, 10);
  assert.equal(estudiantes[0].horasAcreditadas, 7.5);
  assert.equal(estudiantes[0].horasPendientes, 2.5);
  assert.equal(estudiantes[1].carnet, "24118");
  assert.equal(estudiantes[1].horasAcreditadas, 0);
});

test("el detalle se ordena por horas y el carnet desempata", () => {
  const estudiantes = plegarPorEstudiante(
    [
      grupoCarnet("24300", "ACREDITADA", 2),
      grupoCarnet("24100", "ACREDITADA", 2),
      grupoCarnet("24200", "ACREDITADA", 9),
    ],
    10
  );

  assert.deepEqual(
    estudiantes.map(({ carnet }) => carnet),
    ["24200", "24100", "24300"]
  );
});

test("el detalle se corta en el máximo pedido, dejando fuera a los de menos horas", () => {
  const estudiantes = plegarPorEstudiante(
    [
      grupoCarnet("24100", "ACREDITADA", 1),
      grupoCarnet("24200", "ACREDITADA", 5),
      grupoCarnet("24300", "ACREDITADA", 3),
    ],
    2
  );

  assert.deepEqual(
    estudiantes.map(({ carnet }) => carnet),
    ["24200", "24300"]
  );
});

test("el nombre de la cuenta gana sobre el que trae el registro", () => {
  const detalle = plegarPorEstudiante([grupoCarnet("24117", "ACREDITADA", 2)], 10);

  const [fila] = nombrarEstudiantes(
    detalle,
    [{ carnet: "24117", nombreCompleto: "Ana Lucía Morales Castillo" }],
    [{ carnet: "24117", nombreEstudiante: "A. Morales" }]
  );

  assert.equal(fila.estudiante, "Ana Lucía Morales Castillo");
  assert.equal(fila.vinculado, true);
});

test("un carnet sin cuenta conserva el nombre de la hoja y queda señalado", () => {
  const detalle = plegarPorEstudiante([grupoCarnet("24999", "PENDIENTE", 2)], 10);

  const [fila] = nombrarEstudiantes(
    detalle,
    [],
    [{ carnet: "24999", nombreEstudiante: "Diego P." }]
  );

  assert.equal(fila.estudiante, "Diego P.");
  assert.equal(fila.vinculado, false);
});

test("el carnet se compara sin distinguir mayúsculas", () => {
  const detalle = plegarPorEstudiante([grupoCarnet("A24117", "ACREDITADA", 2)], 10);

  const [fila] = nombrarEstudiantes(
    detalle,
    [{ carnet: "a24117", nombreCompleto: "Ana Lucía Morales Castillo" }],
    []
  );

  assert.equal(fila.estudiante, "Ana Lucía Morales Castillo");
  assert.equal(fila.vinculado, true);
});

test("un carnet sin nombre en ninguna parte se presenta por su carnet", () => {
  const detalle = plegarPorEstudiante([grupoCarnet("24888", "PENDIENTE", 1)], 10);

  const [fila] = nombrarEstudiantes(detalle, [], []);

  assert.equal(fila.estudiante, "24888");
  assert.equal(fila.vinculado, false);
});

test("el reporte solo admite el periodo y descarta los demás filtros", () => {
  assert.deepEqual(
    interpretarFiltrosReporte({
      desde: "2026-10-01",
      hasta: "2026-10-31",
      estado: "PENDIENTE",
      q: "morales",
      vinculo: "sin-cuenta",
      pagina: "3",
    }),
    { desde: "2026-10-01", hasta: "2026-10-31" }
  );
});

test("un periodo invertido conserva la fecha de inicio", () => {
  assert.deepEqual(interpretarFiltrosReporte({ desde: "2026-11-30", hasta: "2026-10-01" }), {
    desde: "2026-11-30",
    hasta: undefined,
  });
});

test("un periodo mal escrito se ignora en lugar de romper el reporte", () => {
  assert.deepEqual(interpretarFiltrosReporte({ desde: "ayer", hasta: "2026/10/31" }), {
    desde: undefined,
    hasta: undefined,
  });
});
