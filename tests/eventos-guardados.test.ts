import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import { obtenerEventosGuardados } from "../src/lib/perfil/consultas-eventos-guardados";
import type { RepositorioEventosGuardados } from "../src/lib/perfil/repositorio-eventos-guardados";
import { ServicioEventosGuardados } from "../src/lib/perfil/servicio-eventos-guardados";

class RepositorioFalso implements RepositorioEventosGuardados {
  guardados: { idUsuario: number; idEvento: number }[] = [];
  quitados: { idUsuario: number; idEvento: number }[] = [];

  constructor(
    private readonly opciones: { publicado?: boolean; existia?: boolean; ids?: number[] } = {}
  ) {}

  async eventoPublicado(): Promise<boolean> {
    return this.opciones.publicado ?? true;
  }

  async guardar(idUsuario: number, idEvento: number): Promise<void> {
    this.guardados.push({ idUsuario, idEvento });
  }

  async quitar(idUsuario: number, idEvento: number): Promise<boolean> {
    this.quitados.push({ idUsuario, idEvento });
    return this.opciones.existia ?? true;
  }

  async idsGuardados(): Promise<number[]> {
    return this.opciones.ids ?? [];
  }
}

test("guardar un evento publicado lo registra para el usuario de la sesión", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioEventosGuardados(repositorio);

  const resultado = await servicio.guardar(7, 42);

  assert.deepEqual(resultado, { tipo: "guardado" });
  assert.deepEqual(repositorio.guardados, [{ idUsuario: 7, idEvento: 42 }]);
});

test("un evento que no está publicado no se puede guardar", async () => {
  const repositorio = new RepositorioFalso({ publicado: false });
  const servicio = new ServicioEventosGuardados(repositorio);

  const resultado = await servicio.guardar(7, 42);

  assert.equal(resultado.tipo, "no_encontrado");
  assert.equal(repositorio.guardados.length, 0);
});

test("guardar dos veces el mismo evento no es un error", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioEventosGuardados(repositorio);

  assert.equal((await servicio.guardar(7, 42)).tipo, "guardado");
  assert.equal((await servicio.guardar(7, 42)).tipo, "guardado");
  assert.equal(repositorio.guardados.length, 2);
});

test("un identificador de evento inválido no llega al repositorio", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioEventosGuardados(repositorio);

  for (const idEvento of [0, -3, 1.5, Number.NaN]) {
    assert.equal((await servicio.guardar(7, idEvento)).tipo, "no_encontrado");
    assert.equal((await servicio.quitar(7, idEvento)).tipo, "no_encontrado");
  }

  assert.equal(repositorio.guardados.length, 0);
  assert.equal(repositorio.quitados.length, 0);
});

test("quitar un evento guardado responde quitado", async () => {
  const repositorio = new RepositorioFalso();
  const servicio = new ServicioEventosGuardados(repositorio);

  assert.deepEqual(await servicio.quitar(7, 42), { tipo: "quitado" });
  assert.deepEqual(repositorio.quitados, [{ idUsuario: 7, idEvento: 42 }]);
});

test("quitar un evento que no estaba guardado responde no encontrado", async () => {
  const servicio = new ServicioEventosGuardados(new RepositorioFalso({ existia: false }));

  assert.equal((await servicio.quitar(7, 42)).tipo, "no_encontrado");
});

test("quitar no exige que el evento siga publicado", async () => {
  // AEUVG puede cancelar un evento que el estudiante ya tenía guardado; aun así
  // debe poder retirarlo de su lista.
  const repositorio = new RepositorioFalso({ publicado: false });
  const servicio = new ServicioEventosGuardados(repositorio);

  assert.deepEqual(await servicio.quitar(7, 42), { tipo: "quitado" });
});

test("los identificadores guardados se devuelven como conjunto", async () => {
  const servicio = new ServicioEventosGuardados(new RepositorioFalso({ ids: [1, 5, 5] }));

  const guardados = await servicio.idsGuardados(7, [1, 5, 9]);

  assert.equal(guardados.has(1), true);
  assert.equal(guardados.has(5), true);
  assert.equal(guardados.has(9), false);
  assert.equal(guardados.size, 2);
});

type Llamada = { where?: Record<string, unknown>; orderBy?: unknown; take?: number };

function instalarPrismaFalso(filas: unknown[]) {
  const llamadas: Llamada[] = [];
  (globalThis as { prisma?: unknown }).prisma = {
    evento: {
      findMany: async (argumentos: Llamada) => {
        llamadas.push(argumentos);
        return filas;
      },
    },
  };

  return llamadas;
}

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

test("el listado del perfil solo pide eventos publicados guardados por el usuario", async () => {
  const llamadas = instalarPrismaFalso([]);
  const ahora = new Date("2026-10-06T12:00:00.000Z");

  await obtenerEventosGuardados(7, { ahora, limite: 5 });

  const [proximos, pasados] = llamadas;
  const donde = proximos.where as {
    estado: string;
    guardados: { some: { idUsuario: number } };
    fechaFin: { gte: Date };
  };

  assert.equal(donde.estado, "PUBLICADO");
  assert.equal(donde.guardados.some.idUsuario, 7);
  assert.equal(donde.fechaFin.gte.toISOString(), ahora.toISOString());
  assert.deepEqual(proximos.orderBy, [{ fechaInicio: "asc" }, { idEvento: "asc" }]);
  assert.deepEqual(pasados.orderBy, [{ fechaInicio: "desc" }, { idEvento: "desc" }]);
  assert.equal(proximos.take, 5);
});

test("un usuario inválido no consulta los eventos guardados", async () => {
  const llamadas = instalarPrismaFalso([]);

  assert.deepEqual(await obtenerEventosGuardados(0), { proximos: [], pasados: [] });
  assert.equal(llamadas.length, 0);
});

function usuario(): UsuarioSesion {
  return {
    idUsuario: 7,
    correo: "estudiante.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    roles: [ROLES.estudiante],
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("guardar un evento sin sesión responde 401 y no ejecuta el manejador", async () => {
  let ejecutado = false;
  const manejador = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [], async () => {
    ejecutado = true;
    return Response.json({ ok: true });
  });

  assert.equal((await manejador()).status, 401);
  assert.equal(ejecutado, false);
});

test("un estudiante con sesión sí puede guardar eventos", async () => {
  const manejador = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario() }),
    [],
    async () => Response.json({ ok: true })
  );

  assert.equal((await manejador()).status, 200);
});
