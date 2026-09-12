import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  listarEventosEnRango,
  listarEventosPublicados,
  obtenerEventoPublicado,
} from "../src/lib/eventos/consultas-eventos";

type Llamada = { where: unknown; orderBy?: unknown; skip?: number; take?: number };

/**
 * Cliente de Prisma falso. obtenerPrisma() reutiliza el cliente guardado en el
 * objeto global, así que basta con dejarlo puesto para que las consultas de
 * eventos se ejecuten contra este doble y no contra una base real.
 */
function instalarPrismaFalso(filas: unknown[]) {
  const llamadas: Llamada[] = [];
  const cliente = {
    evento: {
      count: async ({ where }: Llamada) => {
        llamadas.push({ where });
        return filas.length;
      },
      findMany: async (argumentos: Llamada) => {
        llamadas.push(argumentos);
        return filas;
      },
      findFirst: async (argumentos: Llamada) => {
        llamadas.push(argumentos);
        return filas[0] ?? null;
      },
    },
  };

  (globalThis as { prisma?: unknown }).prisma = cliente;
  return llamadas;
}

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

function evento(cambios: Record<string, unknown> = {}) {
  return {
    idEvento: 1,
    nombre: "Feria de voluntariado",
    fechaInicio: new Date("2027-02-10T15:00:00.000Z"),
    fechaFin: new Date("2027-02-10T18:00:00.000Z"),
    ubicacion: "Plaza central",
    imagenUrl: null,
    destacado: false,
    estado: "PUBLICADO",
    tipoActividad: "VOLUNTARIADO",
    categoria: { idCategoriaEvento: 4, nombre: "Festival", color: "#5A35E8" },
    organizadores: [],
    descripcion: "Descripción del evento.",
    informacionAdicional: null,
    cupo: null,
    ...cambios,
  };
}

test("el listado público solo pide eventos publicados que no han terminado", async () => {
  const llamadas = instalarPrismaFalso([evento()]);
  const ahora = new Date("2026-09-15T12:00:00.000Z");

  await listarEventosPublicados({ ahora });

  const where = llamadas[0].where as { estado: string; fechaFin: { gte: Date } };
  assert.equal(where.estado, "PUBLICADO");
  assert.equal(where.fechaFin.gte.toISOString(), ahora.toISOString());
});

test("las condiciones adicionales se combinan con la base", async () => {
  const llamadas = instalarPrismaFalso([]);

  await listarEventosPublicados({ condiciones: { idCategoriaEvento: 7 } });

  const where = llamadas[0].where as { estado: string; idCategoriaEvento: number };
  assert.equal(where.estado, "PUBLICADO");
  assert.equal(where.idCategoriaEvento, 7);
});

test("la paginación calcula el salto y la cantidad de páginas", async () => {
  const filas = Array.from({ length: 4 }, (_, indice) => evento({ idEvento: indice + 1 }));
  const llamadas = instalarPrismaFalso(filas);

  const resultado = await listarEventosPublicados({ pagina: 2, porPagina: 3 });

  const consulta = llamadas.find((llamada) => llamada.take !== undefined);
  assert.equal(consulta?.skip, 3);
  assert.equal(consulta?.take, 3);
  assert.equal(resultado.total, 4);
  assert.equal(resultado.paginas, 2);
});

test("una página inválida se corrige a la primera", async () => {
  const llamadas = instalarPrismaFalso([]);

  const resultado = await listarEventosPublicados({ pagina: -5 });

  assert.equal(resultado.pagina, 1);
  assert.equal(llamadas.find((llamada) => llamada.take !== undefined)?.skip, 0);
});

test("sin eventos la consulta reporta una sola página vacía", async () => {
  instalarPrismaFalso([]);

  const resultado = await listarEventosPublicados();

  assert.deepEqual(resultado.eventos, []);
  assert.equal(resultado.total, 0);
  assert.equal(resultado.paginas, 1);
});

test("el organizador principal encabeza la lista de organizadores", async () => {
  instalarPrismaFalso([
    evento({
      organizadores: [
        {
          organizadorPrincipal: false,
          unidadUvg: "Vida Estudiantil",
          asociacion: null,
          club: null,
        },
        {
          organizadorPrincipal: true,
          unidadUvg: null,
          asociacion: { nombre: "AEUVG" },
          club: null,
        },
      ],
    }),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(eventos[0].organizadores, ["AEUVG", "Vida Estudiantil"]);
});

test("un organizador sin nombre no aparece en la tarjeta", async () => {
  instalarPrismaFalso([
    evento({
      organizadores: [
        { organizadorPrincipal: true, unidadUvg: null, asociacion: null, club: null },
        {
          organizadorPrincipal: false,
          unidadUvg: null,
          asociacion: null,
          club: { nombre: "Club" },
        },
      ],
    }),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(eventos[0].organizadores, ["Club"]);
});

test("el detalle exige que el evento esté publicado", async () => {
  const llamadas = instalarPrismaFalso([evento()]);

  const detalle = await obtenerEventoPublicado(1);

  const where = llamadas[0].where as { idEvento: number; estado: string };
  assert.equal(where.idEvento, 1);
  assert.equal(where.estado, "PUBLICADO");
  assert.equal(detalle?.descripcion, "Descripción del evento.");
});

test("un identificador inválido no llega a consultar la base", async () => {
  const llamadas = instalarPrismaFalso([evento()]);

  assert.equal(await obtenerEventoPublicado(0), null);
  assert.equal(await obtenerEventoPublicado(-3), null);
  assert.equal(await obtenerEventoPublicado(1.5), null);
  assert.equal(await obtenerEventoPublicado(Number.NaN), null);
  assert.equal(llamadas.length, 0);
});

test("el rango del calendario incluye los eventos que lo cruzan", async () => {
  const llamadas = instalarPrismaFalso([evento()]);
  const desde = new Date("2027-02-01T06:00:00.000Z");
  const hasta = new Date("2027-03-01T05:59:59.999Z");

  await listarEventosEnRango(desde, hasta);

  const where = llamadas[0].where as { fechaInicio: { lte: Date }; fechaFin: { gte: Date } };
  assert.equal(where.fechaInicio.lte.toISOString(), hasta.toISOString());
  assert.equal(where.fechaFin.gte.toISOString(), desde.toISOString());
});

test("un rango invertido devuelve una lista vacía sin consultar", async () => {
  const llamadas = instalarPrismaFalso([evento()]);

  const eventos = await listarEventosEnRango(
    new Date("2027-03-01T00:00:00.000Z"),
    new Date("2027-02-01T00:00:00.000Z")
  );

  assert.deepEqual(eventos, []);
  assert.equal(llamadas.length, 0);
});
