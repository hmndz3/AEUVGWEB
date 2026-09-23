import assert from "node:assert/strict";
import test from "node:test";

import { normalizarTexto, textoDeBusqueda } from "../src/lib/eventos/busqueda";
import { condicionesDeFiltros } from "../src/lib/eventos/filtros-eventos";
import {
  contarFiltros,
  interpretarFiltrosEventos,
  parametrosDeFiltros,
} from "../src/validators/eventos";

test("los filtros válidos se interpretan con su tipo correspondiente", () => {
  const filtros = interpretarFiltrosEventos({
    q: "  feria de voluntariado  ",
    desde: "2026-09-20",
    hasta: "2026-10-05",
    categoria: "4",
    tipo: "VOLUNTARIADO",
    asociacion: "2",
    club: "7",
    pagina: "3",
  });

  assert.deepEqual(filtros, {
    q: "feria de voluntariado",
    desde: "2026-09-20",
    hasta: "2026-10-05",
    categoria: 4,
    tipo: "VOLUNTARIADO",
    asociacion: 2,
    club: 7,
    pagina: 3,
  });
});

test("un parámetro inválido se descarta en lugar de fallar", () => {
  const filtros = interpretarFiltrosEventos({
    categoria: "no-es-un-numero",
    tipo: "DEPORTIVA",
    desde: "20/09/2026",
    pagina: "-4",
    q: "a",
  });

  assert.deepEqual(filtros, {});
});

test("los parámetros válidos conviven con los inválidos", () => {
  const filtros = interpretarFiltrosEventos({ categoria: "5", tipo: "INVENTADO" });

  assert.deepEqual(filtros, { categoria: 5 });
});

test("un rango invertido conserva la fecha de inicio y descarta la de fin", () => {
  const filtros = interpretarFiltrosEventos({ desde: "2026-10-05", hasta: "2026-09-20" });

  assert.deepEqual(filtros, { desde: "2026-10-05" });
});

test("los parámetros repetidos toman el primer valor", () => {
  const filtros = interpretarFiltrosEventos({ categoria: ["3", "9"] });

  assert.equal(filtros.categoria, 3);
});

test("los filtros también se leen desde URLSearchParams", () => {
  const filtros = interpretarFiltrosEventos(
    new URLSearchParams("q=festival&categoria=2&tipo=RECREATIVA")
  );

  assert.deepEqual(filtros, { q: "festival", categoria: 2, tipo: "RECREATIVA" });
});

test("la página no cuenta como filtro activo", () => {
  assert.equal(contarFiltros({ pagina: 4 }), 0);
  assert.equal(contarFiltros({ pagina: 4, categoria: 2, q: "festival" }), 2);
});

test("los enlaces conservan los filtros pero no la página", () => {
  const parametros = parametrosDeFiltros({ q: "festival", categoria: 2, pagina: 3 });

  assert.deepEqual(parametros, { q: "festival", categoria: "2" });
});

test("sin filtros la consulta no agrega ninguna condición", () => {
  assert.deepEqual(condicionesDeFiltros({}), {});
});

test("la categoría y el tipo se comparan directamente", () => {
  const condiciones = condicionesDeFiltros({ categoria: 4, tipo: "ACADEMICA" });

  assert.equal(condiciones.idCategoriaEvento, 4);
  assert.equal(condiciones.tipoActividad, "ACADEMICA");
});

test("el rango de fechas cubre el día completo en hora de Guatemala", () => {
  const condiciones = condicionesDeFiltros({ desde: "2026-09-20", hasta: "2026-09-20" });

  const desde = (condiciones.fechaFin as { gte: Date }).gte;
  const hasta = (condiciones.fechaInicio as { lte: Date }).lte;

  // 00:00 en Guatemala son las 06:00 UTC del mismo día.
  assert.equal(desde.toISOString(), "2026-09-20T06:00:00.000Z");
  assert.equal(hasta.toISOString(), "2026-09-21T05:59:59.999Z");
});

test("el rango se interpreta como cruce y no como contención", () => {
  const condiciones = condicionesDeFiltros({ desde: "2026-09-20", hasta: "2026-09-25" });

  // Un evento entra si termina después del inicio del rango y empieza antes
  // del final: basta con que se traslape.
  assert.ok("gte" in (condiciones.fechaFin as object));
  assert.ok("lte" in (condiciones.fechaInicio as object));
});

test("asociación y club se combinan con AND sobre los organizadores", () => {
  const condiciones = condicionesDeFiltros({ asociacion: 2, club: 7 });
  const conjunciones = condiciones.AND as Record<string, unknown>[];

  assert.equal(conjunciones.length, 2);
  assert.deepEqual(conjunciones[0], { organizadores: { some: { idAsociacion: 2 } } });
  assert.deepEqual(conjunciones[1], { organizadores: { some: { idClub: 7 } } });
});

test("la búsqueda compara contra el texto normalizado del evento", () => {
  const condiciones = condicionesDeFiltros({ q: "Música" });

  assert.deepEqual(condiciones.textoBusqueda, { contains: "musica" });
});

test("la normalización quita acentos, mayúsculas y espacios de más", () => {
  assert.equal(normalizarTexto("  Semana de la  MÚSICA  "), "semana de la musica");
  assert.equal(normalizarTexto("Elección de Junta Directiva"), "eleccion de junta directiva");
  assert.equal(normalizarTexto("Diseño"), "diseno");
});

test("el texto de búsqueda reúne nombre, descripción y ubicación", () => {
  const texto = textoDeBusqueda({
    nombre: "Feria de Innovación",
    descripcion: "Prototipos y robótica",
    ubicacion: "Edificio I",
  });

  assert.equal(texto, "feria de innovacion prototipos y robotica edificio i");
});

test("una búsqueda acentuada encuentra el texto sin acentos y al revés", () => {
  const texto = textoDeBusqueda({
    nombre: "Semana de la Música",
    descripcion: "Conciertos",
    ubicacion: "Plaza",
  });

  assert.ok(texto.includes(normalizarTexto("musica")));
  assert.ok(texto.includes(normalizarTexto("MÚSICA")));
});
