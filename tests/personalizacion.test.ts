import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import {
  MAXIMO_INTERESES,
  normalizarSeleccion,
  TIPOS_INTERES,
} from "../src/lib/personalizacion/intereses";

test("la selección se queda solo con identificadores reales", () => {
  assert.deepEqual(normalizarSeleccion([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(normalizarSeleccion(["4", "5"]), [4, 5]);
  assert.deepEqual(normalizarSeleccion([0, -1, 2.5, "abc", null, undefined, 7]), [7]);
});

test("un interés repetido se conserva una sola vez", () => {
  assert.deepEqual(normalizarSeleccion([3, 3, 1, 3]), [3, 1]);
});

test("la selección se corta en el máximo", () => {
  const muchos = Array.from({ length: MAXIMO_INTERESES + 5 }, (_, i) => i + 1);

  assert.equal(normalizarSeleccion(muchos).length, MAXIMO_INTERESES);
});

test("una selección vacía es válida: significa no recibir recomendaciones", () => {
  assert.deepEqual(normalizarSeleccion([]), []);
});

test("el tipo de interés identifica a qué tabla apunta la referencia", () => {
  // La referencia es polimórfica y no tiene llave foránea: el tipo es lo único
  // que dice de qué se trata, así que no puede quedarse sin nombre.
  assert.equal(TIPOS_INTERES.categoriaEvento, "categoria_evento");
  assert.equal(new Set(Object.values(TIPOS_INTERES)).size, Object.values(TIPOS_INTERES).length);
});

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

test("los intereses son de la cuenta de la sesión y exigen estar dentro", async () => {
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
