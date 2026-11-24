import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import { soloPublicados } from "../src/lib/eventos/consultas-eventos";

/**
 * El calendario del panel se distingue del público por una sola cosa: no
 * aplica el filtro de publicados. La prueba fija esa diferencia, porque si
 * alguien se la lleva por delante el panel deja de servir para lo que existe.
 */
test("el filtro público deja fuera lo que el panel tiene que ver", () => {
  const condiciones = soloPublicados();

  assert.equal(condiciones.estado, "PUBLICADO");
});

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

test("el calendario del panel exige el rol de administrador", async () => {
  let ejecutado = false;
  const manejador = protegerConAcceso(
    acceso({ tipo: "sin_permiso", usuario: usuario([ROLES.estudiante]) }),
    [ROLES.administrador],
    async () => {
      ejecutado = true;
      return Response.json({ ok: true });
    }
  );

  assert.equal((await manejador()).status, 404);
  assert.equal(ejecutado, false);
});
