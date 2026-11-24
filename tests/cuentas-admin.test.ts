import assert from "node:assert/strict";
import test from "node:test";

import { condicionesDeCuentas } from "../src/lib/admin/consultas-cuentas";
import { ServicioCuentas, type RepositorioCuentas } from "../src/lib/admin/servicio-cuentas";
import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import {
  interpretarFiltrosCuentas,
  parametrosDeCuentas,
  type EstadoCuenta,
} from "../src/validators/cuentas-admin";

class RepositorioFalso implements RepositorioCuentas {
  cambios: { idUsuario: number; estado: EstadoCuenta }[] = [];

  constructor(private readonly actual: EstadoCuenta | null = "ACTIVO") {}

  async estadoDe(): Promise<EstadoCuenta | null> {
    return this.actual;
  }

  async cambiarEstado(idUsuario: number, estado: EstadoCuenta): Promise<boolean> {
    this.cambios.push({ idUsuario, estado });
    return true;
  }
}

// ---------- Filtros ----------

test("los filtros válidos se interpretan con sus tipos", () => {
  assert.deepEqual(
    interpretarFiltrosCuentas({
      q: "morales",
      estado: "bloqueado",
      facultad: "3",
      verificacion: "sin-verificar",
      pagina: "2",
    }),
    {
      q: "morales",
      estado: "BLOQUEADO",
      facultad: 3,
      verificacion: "sin-verificar",
      pagina: 2,
    }
  );
});

test("un parámetro inválido se descarta sin tumbar la pantalla", () => {
  assert.deepEqual(
    interpretarFiltrosCuentas({
      q: "a",
      estado: "inventado",
      facultad: "cero",
      verificacion: "quizas",
      pagina: "-1",
    }),
    {}
  );
});

test("sin filtros la consulta no agrega ninguna condición", () => {
  assert.deepEqual(condicionesDeCuentas({}), {});
});

test("el estado y la verificación se consultan sobre la cuenta", () => {
  assert.deepEqual(condicionesDeCuentas({ estado: "BLOQUEADO" }), { estado: "BLOQUEADO" });
  assert.deepEqual(condicionesDeCuentas({ verificacion: "verificados" }), {
    correoVerificado: true,
  });
  assert.deepEqual(condicionesDeCuentas({ verificacion: "sin-verificar" }), {
    correoVerificado: false,
  });
});

test("la facultad y la búsqueda se consultan sobre el estudiante", () => {
  assert.deepEqual(condicionesDeCuentas({ facultad: 4 }), {
    estudiante: { carrera: { idFacultad: 4 } },
  });

  const porTexto = condicionesDeCuentas({ q: "24117" });
  assert.equal(
    (porTexto.estudiante as { OR?: unknown[] } | undefined)?.OR?.length,
    3,
    "se busca por carnet, nombre y correo"
  );
});

test("los filtros se combinan sin pisarse", () => {
  const condiciones = condicionesDeCuentas({ estado: "ACTIVO", facultad: 2, q: "ana" });

  assert.equal(condiciones.estado, "ACTIVO");
  const estudiante = condiciones.estudiante as { carrera?: unknown; OR?: unknown[] };
  assert.deepEqual(estudiante.carrera, { idFacultad: 2 });
  assert.equal(estudiante.OR?.length, 3);
});

test("la página no viaja en los parámetros de los enlaces", () => {
  assert.deepEqual(parametrosDeCuentas({ q: "ana", estado: "ACTIVO", pagina: 3 }), {
    q: "ana",
    estado: "ACTIVO",
  });
});

// ---------- Estado de la cuenta ----------

test("una cuenta ajena se puede bloquear", async () => {
  const repositorio = new RepositorioFalso("ACTIVO");

  const resultado = await new ServicioCuentas(repositorio).cambiarEstado(9, "BLOQUEADO", 1);

  assert.deepEqual(resultado, { tipo: "aplicado", estado: "BLOQUEADO" });
  assert.deepEqual(repositorio.cambios, [{ idUsuario: 9, estado: "BLOQUEADO" }]);
});

test("el administrador no puede bloquear su propia cuenta", async () => {
  const repositorio = new RepositorioFalso("ACTIVO");

  const resultado = await new ServicioCuentas(repositorio).cambiarEstado(1, "BLOQUEADO", 1);

  assert.equal(resultado.tipo, "no_permitido");
  assert.equal(repositorio.cambios.length, 0);
});

test("el administrador sí puede dejar su propia cuenta activa", async () => {
  const repositorio = new RepositorioFalso("PENDIENTE");

  const resultado = await new ServicioCuentas(repositorio).cambiarEstado(1, "ACTIVO", 1);

  assert.deepEqual(resultado, { tipo: "aplicado", estado: "ACTIVO" });
});

test("pedir el estado que la cuenta ya tiene se rechaza", async () => {
  const repositorio = new RepositorioFalso("BLOQUEADO");

  const resultado = await new ServicioCuentas(repositorio).cambiarEstado(9, "BLOQUEADO", 1);

  assert.equal(resultado.tipo, "no_permitido");
  assert.equal(repositorio.cambios.length, 0);
});

test("una cuenta que no existe responde que no se encontró", async () => {
  const repositorio = new RepositorioFalso(null);

  const resultado = await new ServicioCuentas(repositorio).cambiarEstado(99, "ACTIVO", 1);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

// ---------- Permisos ----------

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "admin.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Administrador Prueba",
    fotoUrl: null,
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("el panel de cuentas exige el rol de administrador", async () => {
  const sinSesion = protegerConAcceso(
    acceso({ tipo: "sin_sesion" }),
    [ROLES.administrador],
    async () => Response.json({ ok: true })
  );
  assert.equal((await sinSesion()).status, 401);

  let ejecutado = false;
  const estudiante = protegerConAcceso(
    acceso({ tipo: "sin_permiso", usuario: usuario([ROLES.estudiante]) }),
    [ROLES.administrador],
    async () => {
      ejecutado = true;
      return Response.json({ ok: true });
    }
  );
  assert.equal((await estudiante()).status, 404);
  assert.equal(ejecutado, false);
});
