import assert from "node:assert/strict";
import test from "node:test";

import { decidirAcceso } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES, type Rol } from "../src/lib/auth/roles";

function usuario(roles: Rol[]): UsuarioSesion {
  return {
    idUsuario: 1,
    correo: "estudiante.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Estudiante Prueba",
    roles,
  };
}

test("sin sesión no se concede acceso a una ruta protegida", () => {
  assert.equal(decidirAcceso(null, [ROLES.administrador]).tipo, "sin_sesion");
  assert.equal(decidirAcceso(null).tipo, "sin_sesion");
});

test("el estudiante no alcanza las secciones de administración", () => {
  const resultado = decidirAcceso(usuario([ROLES.estudiante]), [ROLES.administrador]);

  assert.equal(resultado.tipo, "sin_permiso");
});

test("el tutor tampoco alcanza las secciones de administración", () => {
  assert.equal(decidirAcceso(usuario([ROLES.tutor]), [ROLES.administrador]).tipo, "sin_permiso");
});

test("el administrador accede a las secciones de administración", () => {
  const resultado = decidirAcceso(usuario([ROLES.administrador]), [ROLES.administrador]);

  assert.equal(resultado.tipo, "autorizado");
});

test("un usuario con varios roles accede por cualquiera de ellos", () => {
  const conAmbos = usuario([ROLES.estudiante, ROLES.administrador]);

  assert.equal(decidirAcceso(conAmbos, [ROLES.administrador]).tipo, "autorizado");
  assert.equal(decidirAcceso(conAmbos, [ROLES.estudiante]).tipo, "autorizado");
});

test("una ruta que solo exige sesión admite cualquier rol, incluso sin ninguno", () => {
  assert.equal(decidirAcceso(usuario([ROLES.estudiante])).tipo, "autorizado");
  assert.equal(decidirAcceso(usuario([])).tipo, "autorizado");
});

test("una ruta abierta a tutores y administradores excluye al estudiante", () => {
  const permitidos = [ROLES.tutor, ROLES.administrador];

  assert.equal(decidirAcceso(usuario([ROLES.tutor]), permitidos).tipo, "autorizado");
  assert.equal(decidirAcceso(usuario([ROLES.administrador]), permitidos).tipo, "autorizado");
  assert.equal(decidirAcceso(usuario([ROLES.estudiante]), permitidos).tipo, "sin_permiso");
});

test("sin roles asignados no se alcanza una ruta que exige uno", () => {
  assert.equal(decidirAcceso(usuario([]), [ROLES.administrador]).tipo, "sin_permiso");
});
