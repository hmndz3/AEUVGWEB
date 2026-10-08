import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  textoDeBusquedaAsociacion,
  textoDeBusquedaClub,
} from "../src/lib/organizaciones/busqueda-organizaciones";
import {
  esAsociacionGeneral,
  listarAsociaciones,
  listarClubes,
  obtenerAsociacion,
  obtenerClub,
} from "../src/lib/organizaciones/consultas-organizaciones";
import {
  condicionOrganizador,
  obtenerActividadesDeOrganizador,
} from "../src/lib/organizaciones/eventos-organizador";

type Llamada = {
  modelo: string;
  where?: Record<string, unknown>;
  orderBy?: unknown;
  skip?: number;
  take?: number;
  select?: Record<string, unknown>;
};

/**
 * Cliente de Prisma falso. obtenerPrisma() reutiliza el cliente guardado en el
 * objeto global, así que basta con dejarlo puesto para que las consultas se
 * ejecuten contra este doble y no contra una base real.
 */
function instalarPrismaFalso(filas: Record<string, unknown[]>) {
  const llamadas: Llamada[] = [];

  const modelo = (nombre: string) => ({
    count: async (argumentos: Llamada) => {
      llamadas.push({ ...argumentos, modelo: nombre });
      return (filas[nombre] ?? []).length;
    },
    findMany: async (argumentos: Llamada) => {
      llamadas.push({ ...argumentos, modelo: nombre });
      return filas[nombre] ?? [];
    },
    findFirst: async (argumentos: Llamada) => {
      llamadas.push({ ...argumentos, modelo: nombre });
      return (filas[nombre] ?? [])[0] ?? null;
    },
  });

  (globalThis as { prisma?: unknown }).prisma = {
    asociacion: modelo("asociacion"),
    club: modelo("club"),
    evento: modelo("evento"),
  };

  return llamadas;
}

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

function asociacion(cambios: Record<string, unknown> = {}) {
  return {
    idAsociacion: 3,
    nombre: "Asociación de Estudiantes de Ingeniería",
    siglas: "AEI",
    descripcion: "Representa al estudiantado de la facultad.",
    mision: "Acompañar al estudiantado de ingeniería.",
    vision: "Una facultad con participación activa.",
    correo: "aei@uvg.edu.gt",
    informacionContacto: "Oficina CIT-204",
    imagenUrl: null,
    integrantes: [],
    redesSociales: [],
    ...cambios,
  };
}

function club(cambios: Record<string, unknown> = {}) {
  return {
    idClub: 8,
    nombre: "Club de Robótica",
    descripcion: "Construcción de robots para competencias.",
    actividades: "Reuniones semanales y competencias nacionales.",
    correo: null,
    informacionContacto: null,
    imagenUrl: null,
    redesSociales: [],
    ...cambios,
  };
}

function evento(cambios: Record<string, unknown> = {}) {
  return {
    idEvento: 1,
    nombre: "Feria de carreras",
    fechaInicio: new Date("2027-02-10T15:00:00.000Z"),
    fechaFin: new Date("2027-02-10T18:00:00.000Z"),
    ubicacion: "Plaza central",
    imagenUrl: null,
    destacado: false,
    estado: "PUBLICADO",
    tipoActividad: "ACADEMICA",
    categoria: { idCategoriaEvento: 2, nombre: "Feria", color: "#5A35E8" },
    organizadores: [],
    ...cambios,
  };
}

test("el listado de asociaciones solo pide las activas", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [asociacion()] });

  await listarAsociaciones();

  assert.equal(llamadas[0].where?.activo, true);
});

test("el listado de asociaciones excluye a la asociación general", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [] });

  await listarAsociaciones();

  const negacion = llamadas[0].where?.NOT as { nombre: { equals: string; mode: string } };
  assert.equal(negacion.nombre.equals, "AEUVG");
  assert.equal(negacion.nombre.mode, "insensitive");
});

test("el buscador compara contra la copia normalizada del texto", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [] });

  await listarAsociaciones({ busqueda: "  INGENIERÍA  " });

  const filtro = llamadas[0].where?.textoBusqueda as { contains: string };
  assert.equal(filtro.contains, "ingenieria");
});

test("un buscador vacío o con solo espacios no agrega condición", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [] });

  await listarAsociaciones({ busqueda: "   " });

  assert.equal(llamadas[0].where?.textoBusqueda, undefined);
});

test("el listado de asociaciones ordena alfabéticamente", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [asociacion()] });

  await listarAsociaciones();

  const consulta = llamadas.find((llamada) => llamada.take !== undefined);
  assert.deepEqual(consulta?.orderBy, { nombre: "asc" });
});

test("la paginación de organizaciones calcula el salto y las páginas", async () => {
  const filas = Array.from({ length: 7 }, (_, indice) => asociacion({ idAsociacion: indice + 1 }));
  const llamadas = instalarPrismaFalso({ asociacion: filas });

  const resultado = await listarAsociaciones({ pagina: 2, porPagina: 3 });

  const consulta = llamadas.find((llamada) => llamada.take !== undefined);
  assert.equal(consulta?.skip, 3);
  assert.equal(consulta?.take, 3);
  assert.equal(resultado.total, 7);
  assert.equal(resultado.paginas, 3);
});

test("una página inválida se corrige a la primera", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [] });

  const resultado = await listarAsociaciones({ pagina: -4 });

  assert.equal(resultado.pagina, 1);
  assert.equal(llamadas.find((llamada) => llamada.take !== undefined)?.skip, 0);
});

test("el listado devuelve el resumen que necesita la tarjeta", async () => {
  instalarPrismaFalso({ asociacion: [asociacion()] });

  const { organizaciones } = await listarAsociaciones();

  assert.deepEqual(organizaciones, [
    {
      id: 3,
      nombre: "Asociación de Estudiantes de Ingeniería",
      siglas: "AEI",
      descripcion: "Representa al estudiantado de la facultad.",
      imagenUrl: null,
    },
  ]);
});

test("el detalle de la asociación pide la junta y las redes activas", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [asociacion()] });

  await obtenerAsociacion(3);

  const select = llamadas[0].select as {
    integrantes: { where: { activo: boolean }; orderBy: unknown };
    redesSociales: { where: { activo: boolean } };
  };
  assert.equal(select.integrantes.where.activo, true);
  assert.deepEqual(select.integrantes.orderBy, [{ ordenVisualizacion: "asc" }, { nombre: "asc" }]);
  assert.equal(select.redesSociales.where.activo, true);
});

test("el detalle de una asociación dada de baja no se devuelve", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [] });

  const resultado = await obtenerAsociacion(3);

  assert.equal(resultado, null);
  assert.equal(llamadas[0].where?.activo, true);
});

test("un identificador inválido no llega a consultar la base", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [asociacion()] });

  assert.equal(await obtenerAsociacion(0), null);
  assert.equal(await obtenerAsociacion(-1), null);
  assert.equal(await obtenerAsociacion(1.5), null);
  assert.equal(await obtenerClub(Number.NaN), null);
  assert.equal(llamadas.length, 0);
});

test("la asociación general se reconoce por su nombre sin distinguir mayúsculas", async () => {
  const llamadas = instalarPrismaFalso({ asociacion: [{ idAsociacion: 1 }] });

  assert.equal(await esAsociacionGeneral(1), true);

  const nombre = llamadas[0].where?.nombre as { equals: string; mode: string };
  assert.equal(nombre.equals, "AEUVG");
  assert.equal(nombre.mode, "insensitive");
});

test("el listado de clubes solo pide los activos y no excluye nombres", async () => {
  const llamadas = instalarPrismaFalso({ club: [club()] });

  await listarClubes();

  assert.equal(llamadas[0].where?.activo, true);
  assert.equal(llamadas[0].where?.NOT, undefined);
});

test("el detalle del club devuelve sus actividades y sus redes", async () => {
  instalarPrismaFalso({
    club: [
      club({ redesSociales: [{ idRedSocial: 4, plataforma: "Instagram", url: "https://x" }] }),
    ],
  });

  const resultado = await obtenerClub(8);

  assert.equal(resultado?.nombre, "Club de Robótica");
  assert.equal(resultado?.actividades, "Reuniones semanales y competencias nacionales.");
  assert.equal(resultado?.redesSociales.length, 1);
});

test("la condición de organizador busca por asociación o por club según el tipo", () => {
  const porAsociacion = condicionOrganizador({ tipo: "asociacion", id: 3 }) as {
    organizadores: { some: { idAsociacion?: number; idClub?: number } };
  };
  const porClub = condicionOrganizador({ tipo: "club", id: 8 }) as {
    organizadores: { some: { idAsociacion?: number; idClub?: number } };
  };

  assert.equal(porAsociacion.organizadores.some.idAsociacion, 3);
  assert.equal(porAsociacion.organizadores.some.idClub, undefined);
  assert.equal(porClub.organizadores.some.idClub, 8);
  assert.equal(porClub.organizadores.some.idAsociacion, undefined);
});

test("las actividades del organizador se parten en próximas y pasadas", async () => {
  const llamadas = instalarPrismaFalso({ evento: [evento()] });
  const ahora = new Date("2026-10-01T12:00:00.000Z");

  const { proximas, pasadas } = await obtenerActividadesDeOrganizador(
    { tipo: "asociacion", id: 3 },
    { ahora, limite: 4 }
  );

  const [primera, segunda] = llamadas;
  const dondeProximas = primera.where as { estado: string; fechaFin: { gte: Date } };
  const dondePasadas = segunda.where as { fechaFin: { lt: Date } };

  assert.equal(dondeProximas.estado, "PUBLICADO");
  assert.equal(dondeProximas.fechaFin.gte.toISOString(), ahora.toISOString());
  assert.equal(dondePasadas.fechaFin.lt.toISOString(), ahora.toISOString());
  assert.deepEqual(primera.orderBy, [{ fechaInicio: "asc" }, { idEvento: "asc" }]);
  assert.deepEqual(segunda.orderBy, [{ fechaInicio: "desc" }, { idEvento: "desc" }]);
  assert.equal(primera.take, 4);
  assert.equal(proximas.length, 1);
  assert.equal(pasadas.length, 1);
});

test("un organizador con identificador inválido no consulta actividades", async () => {
  const llamadas = instalarPrismaFalso({ evento: [evento()] });

  const resultado = await obtenerActividadesDeOrganizador({ tipo: "club", id: 0 });

  assert.deepEqual(resultado, { proximas: [], pasadas: [] });
  assert.equal(llamadas.length, 0);
});

test("el texto de búsqueda de una asociación une nombre, siglas, descripción y misión", () => {
  const texto = textoDeBusquedaAsociacion({
    nombre: "Asociación de Ingeniería",
    siglas: "AEIUVG",
    descripcion: "Comité de Innovación",
    mision: "Impulsar el voluntariado",
  });

  assert.ok(texto.includes("ingenieria"));
  assert.ok(texto.includes("aeiuvg"));
  assert.ok(texto.includes("innovacion"));
  assert.ok(texto.includes("voluntariado"));
});

test("el texto de búsqueda tolera los campos sin información", () => {
  assert.equal(
    textoDeBusquedaClub({ nombre: "Club de Música", descripcion: null, actividades: null }),
    "club de musica"
  );
});
