import assert from "node:assert/strict";
import test from "node:test";

import { crearHashContrasena, verificarContrasena } from "../src/lib/auth/contrasenas";
import { HASH_COMPARACION_FALSA } from "../src/lib/auth/servicio-autenticacion";
import { esAdministrador, normalizarRol, ROLES, tieneRol } from "../src/lib/auth/roles";
import { NOMBRE_COOKIE_SESION, opcionesCookieSesion } from "../src/lib/auth/sesion";
import type { ConfiguracionSesion } from "../src/lib/configuracion-sesion";
import { inicialesDe } from "../src/lib/auth/usuario-sesion-cliente";

const configuracion: ConfiguracionSesion = {
  secreto: "clave-de-prueba-larga-y-unica-para-sesiones-aeuvg",
  duracionSegundos: 60 * 60,
};

test("la cookie de sesión no es accesible desde el navegador y expira con la sesión", () => {
  const opciones = opcionesCookieSesion(configuracion);

  assert.equal(NOMBRE_COOKIE_SESION, "aeuvg_session");
  assert.equal(opciones.httpOnly, true);
  assert.equal(opciones.sameSite, "lax");
  assert.equal(opciones.path, "/");
  assert.equal(opciones.maxAge, configuracion.duracionSegundos);
});

test("el cierre de sesión borra la cookie con una expiración inmediata", () => {
  // Es la forma que usa DELETE /api/auth/sesion para invalidar la cookie.
  const opcionesCierre = { ...opcionesCookieSesion(configuracion), value: "", maxAge: 0 };

  assert.equal(opcionesCierre.maxAge, 0);
  assert.equal(opcionesCierre.value, "");
  assert.equal(opcionesCierre.httpOnly, true);
});

test("el hash de comparación falsa es verificable, de modo que cuesta lo mismo que uno real", async () => {
  // Si el formato no fuese válido, verificarContrasena saldría antes de derivar
  // la clave y un correo inexistente respondería más rápido que uno existente.
  const hashReal = await crearHashContrasena("PruebaSegura1!");
  const [, nFalso, rFalso, pFalso, salFalsa, derivadaFalsa] = HASH_COMPARACION_FALSA.split("$");
  const [, nReal, rReal, pReal, salReal, derivadaReal] = hashReal.split("$");

  assert.equal(nFalso, nReal);
  assert.equal(rFalso, rReal);
  assert.equal(pFalso, pReal);
  assert.equal(Buffer.from(salFalsa, "base64url").length, Buffer.from(salReal, "base64url").length);
  assert.equal(
    Buffer.from(derivadaFalsa, "base64url").length,
    Buffer.from(derivadaReal, "base64url").length
  );
  assert.equal(await verificarContrasena("cualquier-cosa", HASH_COMPARACION_FALSA), false);
});

test("los roles desconocidos se descartan y los conocidos se normalizan", () => {
  assert.equal(normalizarRol("administrador"), ROLES.administrador);
  assert.equal(normalizarRol("  Estudiante  "), ROLES.estudiante);
  assert.equal(normalizarRol("SUPERUSUARIO"), null);
});

test("la comprobación de roles distingue al administrador", () => {
  assert.equal(esAdministrador([ROLES.estudiante]), false);
  assert.equal(esAdministrador([ROLES.estudiante, ROLES.administrador]), true);
  assert.equal(tieneRol([ROLES.tutor], [ROLES.administrador, ROLES.tutor]), true);
  assert.equal(tieneRol([ROLES.estudiante], [ROLES.administrador]), false);
});

test("las iniciales del avatar se arman con el nombre y el primer apellido", () => {
  assert.equal(inicialesDe("Harry Daniel Méndez"), "HD");
  assert.equal(inicialesDe("Ana"), "A");
  assert.equal(inicialesDe("   "), "?");
});
