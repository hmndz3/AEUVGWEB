import assert from "node:assert/strict";
import test from "node:test";

import { construirDondeEventos } from "@/lib/eventos/consultas-reporte-eventos";
import {
  aFilaExportacionEvento,
  COLUMNAS_EXPORTACION_EVENTOS,
  generarCsvEventos,
  nombreArchivoEventos,
  valoresDeFilaEvento,
} from "@/lib/eventos/exportacion-eventos";
import {
  claveMes,
  eventosPorCategoria,
  eventosPorMes,
  eventosPorOrganizador,
  resumirEventos,
  type EventoReporte,
} from "@/lib/eventos/metricas-eventos";
import {
  interpretarFiltrosEventosReporte,
  interpretarOrganizador,
  parametrosDeFiltrosEventos,
} from "@/validators/reporte-eventos";

/**
 * Reporte de eventos.
 *
 * Las cuentas se prueban con eventos escritos a mano: lo que importa es que un
 * evento con varios organizadores no se pierda ni se duplique en los totales,
 * que los meses se agrupen en la hora de Guatemala y que la descarga lleve lo
 * mismo que la pantalla.
 */

function evento(parcial: Partial<EventoReporte> = {}): EventoReporte {
  return {
    idEvento: 1,
    nombre: "Feria de carreras",
    descripcion: "Actividad de ejemplo.",
    fechaInicio: new Date("2026-10-09T15:00:00.000Z"),
    fechaFin: new Date("2026-10-09T19:00:00.000Z"),
    ubicacion: "Plaza central",
    categoria: "Festival",
    tipoActividad: "ACADEMICA",
    estado: "PUBLICADO",
    cupo: 100,
    informacionAdicional: null,
    organizadores: ["AEUVG"],
    guardados: 3,
    horasBeca: 4.5,
    apoyos: 2,
    ...parcial,
  };
}

const AHORA = new Date("2026-11-26T12:00:00.000Z");

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

test("un parámetro con basura se descarta en lugar de tumbar la página", () => {
  const filtros = interpretarFiltrosEventosReporte({
    desde: "ayer",
    categoria: "-3",
    tipo: "FIESTA",
    estado: "PUBLICADO",
  });

  assert.deepEqual(filtros, { estado: "PUBLICADO" });
});

test("un periodo al revés se ordena, que es lo que quiso decir quien lo escribió", () => {
  const filtros = interpretarFiltrosEventosReporte({ desde: "2026-11-30", hasta: "2026-11-01" });

  assert.equal(filtros.desde, "2026-11-01");
  assert.equal(filtros.hasta, "2026-11-30");
});

test("los filtros viajan a la descarga tal como están en la dirección", () => {
  const parametros = parametrosDeFiltrosEventos({ organizador: "aeuvg", categoria: 3 });

  assert.deepEqual(parametros, { organizador: "aeuvg", categoria: "3" });
});

test("el organizador se interpreta solo en las tres formas válidas", () => {
  assert.deepEqual(interpretarOrganizador("aeuvg"), { tipo: "aeuvg" });
  assert.deepEqual(interpretarOrganizador("asociacion:7"), { tipo: "asociacion", id: 7 });
  assert.deepEqual(interpretarOrganizador("club:2"), { tipo: "club", id: 2 });
  assert.equal(interpretarOrganizador("facultad:1"), null);
  assert.equal(interpretarOrganizador(undefined), null);
});

test("el filtro de AEUVG busca sus eventos por la asociación", () => {
  const donde = construirDondeEventos({ organizador: "aeuvg" }, 12);

  assert.deepEqual(donde.organizadores, { some: { idAsociacion: 12 } });
});

test("sin AEUVG en el catálogo, su filtro no devuelve eventos en vez de devolverlos todos", () => {
  const donde = construirDondeEventos({ organizador: "aeuvg" }, null);

  assert.deepEqual(donde.organizadores, { some: { idAsociacion: -1 } });
});

test("el periodo se ancla a la hora de Guatemala", () => {
  const donde = construirDondeEventos({ desde: "2026-10-01", hasta: "2026-10-31" }, 1);
  const rango = donde.fechaInicio as { gte: Date; lte: Date };

  assert.equal(rango.gte.toISOString(), "2026-10-01T06:00:00.000Z");
  assert.equal(rango.lte.toISOString(), "2026-11-01T05:59:59.999Z");
});

test("sin filtros la consulta no impone ninguna condición", () => {
  assert.deepEqual(construirDondeEventos({}, 1), {});
});

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

test("el resumen cuenta los eventos por su situación real, no por el estado guardado", () => {
  const resumen = resumirEventos(
    [
      evento({ idEvento: 1, fechaInicio: new Date("2026-10-01T15:00:00.000Z") }),
      evento({
        idEvento: 2,
        fechaInicio: new Date("2026-12-01T15:00:00.000Z"),
        fechaFin: new Date("2026-12-01T18:00:00.000Z"),
      }),
      evento({ idEvento: 3, estado: "BORRADOR" }),
      evento({ idEvento: 4, estado: "CANCELADO" }),
    ],
    AHORA
  );

  assert.equal(resumen.eventos, 4);
  assert.equal(resumen.porEstado.finalizado, 1);
  assert.equal(resumen.porEstado.proximo, 1);
  assert.equal(resumen.porEstado.borrador, 1);
  assert.equal(resumen.porEstado.cancelado, 1);
});

test("el resumen suma el interés y las horas beca de todos los eventos", () => {
  const resumen = resumirEventos(
    [
      evento({ guardados: 3, horasBeca: 4.5, apoyos: 2, cupo: 100 }),
      evento({ idEvento: 2, guardados: 7, horasBeca: 1.25, apoyos: 1, cupo: 50 }),
    ],
    AHORA
  );

  assert.equal(resumen.guardados, 10);
  assert.equal(resumen.horasBeca, 5.75);
  assert.equal(resumen.apoyos, 3);
  assert.equal(resumen.cupo, 150);
});

test("un evento sin cupo no estorba la suma de cupos", () => {
  const resumen = resumirEventos([evento({ cupo: null })], AHORA);

  assert.equal(resumen.cupo, 0);
});

test("los meses se agrupan en la hora de Guatemala", () => {
  // Las 19:00 del 31 de octubre en Guatemala son el 1 de noviembre en UTC.
  assert.equal(claveMes(new Date("2026-11-01T01:00:00.000Z")), "2026-10");
});

test("los meses salen del más antiguo al más reciente", () => {
  const lineas = eventosPorMes([
    evento({ idEvento: 1, fechaInicio: new Date("2026-11-05T15:00:00.000Z") }),
    evento({ idEvento: 2, fechaInicio: new Date("2026-09-05T15:00:00.000Z") }),
    evento({ idEvento: 3, fechaInicio: new Date("2026-09-20T15:00:00.000Z") }),
  ]);

  assert.deepEqual(
    lineas.map((linea) => linea.clave),
    ["2026-09", "2026-11"]
  );
  assert.equal(lineas[0].eventos, 2);
});

test("las categorías salen de la más usada a la menos", () => {
  const lineas = eventosPorCategoria([
    evento({ idEvento: 1, categoria: "Festival" }),
    evento({ idEvento: 2, categoria: "Conferencia" }),
    evento({ idEvento: 3, categoria: "Conferencia" }),
  ]);

  assert.deepEqual(
    lineas.map((linea) => linea.etiqueta),
    ["Conferencia", "Festival"]
  );
});

test("un evento con dos organizadores cuenta para los dos", () => {
  const lineas = eventosPorOrganizador([evento({ organizadores: ["AEUVG", "Club de robótica"] })]);

  assert.equal(lineas.length, 2);
  assert.equal(lineas[0].eventos, 1);
  assert.equal(lineas[1].eventos, 1);
});

test("un evento sin organizador se agrupa aparte en lugar de desaparecer", () => {
  const lineas = eventosPorOrganizador([evento({ organizadores: [] })]);

  assert.equal(lineas.length, 1);
  assert.equal(lineas[0].etiqueta, "Sin organizador registrado");
});

// ---------------------------------------------------------------------------
// Descarga
// ---------------------------------------------------------------------------

test("la fila de la descarga lleva los datos del evento en la hora del país", () => {
  const fila = aFilaExportacionEvento(evento(), AHORA);

  assert.equal(fila.nombre, "Feria de carreras");
  assert.equal(fila.fechaInicio, "2026-10-09");
  assert.equal(fila.horaInicio, "09:00");
  assert.equal(fila.horaFin, "13:00");
  assert.equal(fila.estado, "Finalizado");
  assert.equal(fila.tipoActividad, "Académica");
  assert.equal(fila.organizadores, "AEUVG");
});

test("cada fila trae un valor por columna", () => {
  const valores = valoresDeFilaEvento(aFilaExportacionEvento(evento(), AHORA));

  assert.equal(valores.length, COLUMNAS_EXPORTACION_EVENTOS.length);
});

test("el CSV escapa lo que rompería las columnas", () => {
  const csv = generarCsvEventos([
    aFilaExportacionEvento(evento({ descripcion: 'Charla; con "comillas"' }), AHORA),
  ]);

  assert.ok(csv.includes('"Charla; con ""comillas"""'));
  assert.ok(csv.startsWith("﻿"));
});

test("el archivo lleva la fecha para que no se pisen las descargas", () => {
  assert.equal(nombreArchivoEventos("xlsx", AHORA), "eventos-2026-11-26.xlsx");
});
