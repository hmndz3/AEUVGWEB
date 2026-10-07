import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  listarEventosPublicados,
  nombresDeOrganizadores,
} from "../src/lib/eventos/consultas-eventos";
import { obtenerActividadesDeOrganizador } from "../src/lib/organizaciones/eventos-organizador";

type Llamada = { where?: Record<string, unknown>; orderBy?: unknown; take?: number };

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
    },
  };

  (globalThis as { prisma?: unknown }).prisma = cliente;
  return llamadas;
}

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

function evento(organizadores: unknown[]) {
  return {
    idEvento: 1,
    nombre: "Semana de Emprendimiento",
    fechaInicio: new Date("2026-10-05T15:00:00.000Z"),
    fechaFin: new Date("2026-10-09T23:00:00.000Z"),
    ubicacion: "Campus central",
    imagenUrl: null,
    destacado: false,
    estado: "PUBLICADO",
    tipoActividad: "ACADEMICA",
    categoria: { idCategoriaEvento: 2, nombre: "Feria", color: "#5A35E8" },
    organizadores,
  };
}

test("una asociación organizadora enlaza a su página de asociación", async () => {
  instalarPrismaFalso([
    evento([
      {
        organizadorPrincipal: true,
        unidadUvg: null,
        asociacion: { idAsociacion: 7, nombre: "Asociación de Ingeniería" },
        club: null,
      },
    ]),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(eventos[0].organizadores, [
    { nombre: "Asociación de Ingeniería", href: "/asociaciones/7" },
  ]);
});

test("un club organizador enlaza a su página de club", async () => {
  instalarPrismaFalso([
    evento([
      {
        organizadorPrincipal: true,
        unidadUvg: null,
        asociacion: null,
        club: { idClub: 12, nombre: "Club de Robótica" },
      },
    ]),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(eventos[0].organizadores, [{ nombre: "Club de Robótica", href: "/clubes/12" }]);
});

test("una unidad de la universidad no lleva enlace", async () => {
  instalarPrismaFalso([
    evento([
      {
        organizadorPrincipal: true,
        unidadUvg: "Vida Estudiantil",
        asociacion: null,
        club: null,
      },
    ]),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(eventos[0].organizadores, [{ nombre: "Vida Estudiantil", href: null }]);
});

test("el organizador principal encabeza la lista aunque se haya guardado después", async () => {
  instalarPrismaFalso([
    evento([
      {
        organizadorPrincipal: false,
        unidadUvg: null,
        asociacion: null,
        club: { idClub: 4, nombre: "Club de Teatro" },
      },
      {
        organizadorPrincipal: true,
        unidadUvg: null,
        asociacion: { idAsociacion: 2, nombre: "Asociación de Humanidades" },
        club: null,
      },
    ]),
  ]);

  const { eventos } = await listarEventosPublicados();

  assert.deepEqual(nombresDeOrganizadores(eventos[0].organizadores), [
    "Asociación de Humanidades",
    "Club de Teatro",
  ]);
});

test("las actividades del organizador se filtran por la tabla de organizadores", async () => {
  const llamadas = instalarPrismaFalso([]);

  await obtenerActividadesDeOrganizador({ tipo: "asociacion", id: 7 });

  const where = llamadas[0].where as {
    organizadores: { some: { idAsociacion: number } };
    estado: string;
  };
  assert.equal(where.organizadores.some.idAsociacion, 7);
  assert.equal(where.estado, "PUBLICADO");
});

test("una actividad de varios días que ya inició sigue contando como próxima", async () => {
  // El evento de prueba empieza el 5 y termina el 9; la consulta se hace el 7.
  instalarPrismaFalso([evento([])]);
  const ahora = new Date("2026-10-07T12:00:00.000Z");

  const { proximas } = await obtenerActividadesDeOrganizador({ tipo: "club", id: 4 }, { ahora });

  assert.equal(proximas.length, 1);
  assert.equal(proximas[0].nombre, "Semana de Emprendimiento");
});

test("el tope de actividades por bloque nunca supera lo pedido", async () => {
  const llamadas = instalarPrismaFalso([]);

  await obtenerActividadesDeOrganizador({ tipo: "club", id: 4 }, { limite: 3 });

  assert.ok(llamadas.every((llamada) => llamada.take === 3));
});
