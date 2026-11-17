import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import {
  ServicioNotificaciones,
  type RepositorioNotificaciones,
} from "../src/lib/notificaciones/servicio-notificaciones";
import {
  ETIQUETAS_TIPO_NOTIFICACION,
  TIPOS_NOTIFICACION,
} from "../src/lib/notificaciones/tipos-notificacion";

class RepositorioFalso implements RepositorioNotificaciones {
  marcadas: { idNotificacion: number; idUsuario: number; ahora: Date }[] = [];
  todas: { idUsuario: number; ahora: Date }[] = [];

  constructor(private readonly deLaCuenta = true) {}

  async marcarLeida(idNotificacion: number, idUsuario: number, ahora: Date): Promise<boolean> {
    if (!this.deLaCuenta) return false;

    this.marcadas.push({ idNotificacion, idUsuario, ahora });
    return true;
  }

  async marcarTodas(idUsuario: number, ahora: Date): Promise<number> {
    this.todas.push({ idUsuario, ahora });
    return 3;
  }
}

const AHORA = new Date("2026-11-20T15:00:00.000Z");
const reloj = () => AHORA;

test("cada tipo de notificación tiene su etiqueta", () => {
  for (const tipo of Object.values(TIPOS_NOTIFICACION)) {
    assert.ok(ETIQUETAS_TIPO_NOTIFICACION[tipo], `falta la etiqueta de ${tipo}`);
  }
});

test("marcar como leída guarda la cuenta y el momento", async () => {
  const repositorio = new RepositorioFalso();

  const resultado = await new ServicioNotificaciones(repositorio, reloj).marcarLeida(4, 7);

  assert.deepEqual(resultado, { tipo: "leida" });
  assert.deepEqual(repositorio.marcadas, [{ idNotificacion: 4, idUsuario: 7, ahora: AHORA }]);
});

test("una notificación ajena responde como no encontrada", async () => {
  // El repositorio incluye la cuenta en la condición, así que una ajena no
  // cambia ninguna fila: el servicio lo traduce a "no encontrada" en lugar de
  // a un rechazo, para no confirmar que existe.
  const repositorio = new RepositorioFalso(false);

  const resultado = await new ServicioNotificaciones(repositorio, reloj).marcarLeida(4, 7);

  assert.deepEqual(resultado, { tipo: "no_encontrada" });
});

test("marcar todas devuelve cuántas cambiaron", async () => {
  const repositorio = new RepositorioFalso();

  const marcadas = await new ServicioNotificaciones(repositorio, reloj).marcarTodas(7);

  assert.equal(marcadas, 3);
  assert.deepEqual(repositorio.todas, [{ idUsuario: 7, ahora: AHORA }]);
});

// ---------- Permisos ----------

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "estudiante.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    fotoUrl: null,
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;

test("las notificaciones exigen sesión pero no un rol concreto", async () => {
  const sinSesion = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [], async () =>
    Response.json({ ok: true })
  );
  assert.equal((await sinSesion()).status, 401);

  const conSesion = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.estudiante]) }),
    [],
    async () => Response.json({ ok: true })
  );
  assert.equal((await conSesion()).status, 200);
});
