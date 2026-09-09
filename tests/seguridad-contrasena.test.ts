import assert from "node:assert/strict";
import test from "node:test";

import { evaluarSeguridadContrasena } from "../src/lib/seguridad-contrasena";

test("el medidor de contraseña progresa según los requisitos de registro", () => {
  assert.deepEqual(evaluarSeguridadContrasena(""), {
    puntaje: 0,
    nivel: "Sin evaluar",
    mensaje: "Escribe una contraseña para evaluarla.",
  });
  assert.equal(evaluarSeguridadContrasena("clave").nivel, "Baja");
  assert.equal(evaluarSeguridadContrasena("ClaveSegura1").nivel, "Media");
  assert.equal(evaluarSeguridadContrasena("ClaveSegura1!").nivel, "Alta");
});
