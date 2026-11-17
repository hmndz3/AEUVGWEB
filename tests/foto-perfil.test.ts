import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import { esImagenDelSitio, RUTA_IMAGEN_PROPIA } from "../src/lib/imagenes/validacion-imagen";

const SUBIDA = "/api/imagenes/0123456789abcdef0123456789abcdef.jpg";

test("solo se admite como fotografía una imagen servida por la plataforma", () => {
  assert.equal(esImagenDelSitio(SUBIDA), true);
  assert.equal(RUTA_IMAGEN_PROPIA.test(SUBIDA), true);

  for (const valor of [
    "https://otrositio.com/foto.jpg",
    "/api/imagenes/no-es-un-hash.jpg",
    "/api/imagenes/0123456789abcdef0123456789abcdef.gif",
    "javascript:alert(1)",
    "",
  ]) {
    assert.equal(esImagenDelSitio(valor), false, `${valor} no debería admitirse`);
  }
});

test("la fotografía admite los tres formatos que acepta la subida", () => {
  for (const extension of ["jpg", "png", "webp"]) {
    assert.equal(
      esImagenDelSitio(`/api/imagenes/0123456789abcdef0123456789abcdef.${extension}`),
      true,
      `debería admitir .${extension}`
    );
  }
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

test("la fotografía exige sesión, pero no un rol concreto", async () => {
  const sinSesion = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [], async () =>
    Response.json({ ok: true })
  );
  assert.equal((await sinSesion()).status, 401);

  // Cualquier cuenta con sesión puede subir la suya: la foto es del estudiante,
  // no de un rol, y el endpoint resuelve de quién es a partir de la sesión.
  const conSesion = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.estudiante]) }),
    [],
    async () => Response.json({ ok: true })
  );
  assert.equal((await conSesion()).status, 200);
});

test("la sesión lleva la fotografía, para el avatar del encabezado", () => {
  const sesion = usuario([ROLES.estudiante]);

  assert.equal(sesion.fotoUrl, null);
  assert.equal("fotoUrl" in sesion, true);
});
