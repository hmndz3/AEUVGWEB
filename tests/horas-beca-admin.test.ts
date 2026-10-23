import assert from "node:assert/strict";
import test from "node:test";

import { protegerConAcceso, type ResultadoGuardia } from "../src/lib/auth/guardias";
import type { UsuarioSesion } from "../src/lib/auth/repositorio-autenticacion";
import { ROLES } from "../src/lib/auth/roles";
import { MAXIMO_HORAS_POR_REGISTRO } from "../src/lib/horas-beca/servicio-horas-beca";
import {
  esquemaRegistroHoraAdmin,
  ETIQUETAS_CAMPO_HORA_BECA,
} from "../src/validators/hora-beca-admin";

function cuerpoValido(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    carnet: "24089",
    nombreEstudiante: "Ana Estudiante Prueba",
    fechaActividad: "2026-10-09",
    horarioApoyo: "14:00-16:00",
    descripcionActividad: "Apoyo en la Feria de Voluntariado",
    cantidadHoras: "2.5",
    observaciones: "",
    ...cambios,
  };
}

const interpretar = (cambios: Record<string, unknown> = {}) =>
  esquemaRegistroHoraAdmin.safeParse(cuerpoValido(cambios));

test("el formulario válido se interpreta con sus tipos", () => {
  const resultado = interpretar();

  assert.equal(resultado.success, true);
  assert.ok(resultado.success);
  assert.equal(resultado.data.carnet, "24089");
  assert.equal(resultado.data.cantidadHoras, 2.5);
  assert.equal(resultado.data.observaciones, null);
  assert.equal(resultado.data.fechaActividad.toISOString(), "2026-10-09T00:00:00.000Z");
});

test("el carnet se guarda normalizado", () => {
  const resultado = interpretar({ carnet: " test-0002 " });

  assert.ok(resultado.success);
  assert.equal(resultado.data.carnet, "TEST-0002");
});

test("se aceptan los formatos de carnet que AEUVG tiene en sus hojas", () => {
  for (const carnet of ["24089", "TEST-0002", "2024-0012", "ABC123"]) {
    assert.equal(interpretar({ carnet }).success, true, carnet);
  }
});

test("un carnet con espacios internos o símbolos se rechaza", () => {
  for (const carnet of ["24 089", "24089!", "24/089", "ab", ""]) {
    assert.equal(interpretar({ carnet }).success, false, carnet);
  }
});

test("el nombre del estudiante es obligatorio", () => {
  for (const nombreEstudiante of ["", "  ", "An"]) {
    assert.equal(interpretar({ nombreEstudiante }).success, false, nombreEstudiante);
  }
});

test("la fecha de la actividad debe ser un día de calendario", () => {
  for (const fechaActividad of ["", "09/10/2026", "2026-10-09T14:00:00Z", "ayer"]) {
    assert.equal(interpretar({ fechaActividad }).success, false, fechaActividad);
  }
});

test("la fecha se convierte a la medianoche en UTC, que es la que compara la base", () => {
  const resultado = interpretar({ fechaActividad: "2026-01-31" });

  assert.ok(resultado.success);
  assert.equal(resultado.data.fechaActividad.toISOString(), "2026-01-31T00:00:00.000Z");
});

/*
 * El horario dejó de escribirse a mano y ahora lo arman dos selectores de hora.
 * El esquema exige esa forma para que un cuerpo armado a mano no reintroduzca
 * el texto libre que hacía imposible comparar turnos.
 */
test("el horario de apoyo exige dos horas de reloj", () => {
  for (const horarioApoyo of ["08:00-11:00", "00:00-23:59", "14:30-16:45"]) {
    assert.equal(interpretar({ horarioApoyo }).success, true, horarioApoyo);
  }
});

test("un horario escrito a mano se rechaza", () => {
  for (const horarioApoyo of ["", "14", "7-9", "de 2 a 4", "14:00 a 16:00", "25:00-26:00"]) {
    assert.equal(interpretar({ horarioApoyo }).success, false, horarioApoyo);
  }
});

test("la hora de fin debe ser posterior a la de inicio", () => {
  assert.equal(interpretar({ horarioApoyo: "16:00-14:00" }).success, false);
  assert.equal(interpretar({ horarioApoyo: "14:00-14:00" }).success, false);
  assert.equal(interpretar({ horarioApoyo: "14:00-14:05" }).success, true);
});

test("la descripción de la actividad es obligatoria", () => {
  assert.equal(interpretar({ descripcionActividad: "" }).success, false);
  assert.equal(interpretar({ descripcionActividad: "  x " }).success, false);
});

test("la cantidad de horas debe ser mayor que cero", () => {
  for (const cantidadHoras of ["0", "-2", "", "muchas"]) {
    assert.equal(interpretar({ cantidadHoras }).success, false, cantidadHoras);
  }
});

test("la cantidad de horas no puede exceder las de un día", () => {
  assert.equal(interpretar({ cantidadHoras: String(MAXIMO_HORAS_POR_REGISTRO) }).success, true);
  assert.equal(
    interpretar({ cantidadHoras: String(MAXIMO_HORAS_POR_REGISTRO + 0.25) }).success,
    false
  );
});

test("la cantidad de horas admite como máximo dos decimales", () => {
  assert.equal(interpretar({ cantidadHoras: "2.25" }).success, true);
  assert.equal(interpretar({ cantidadHoras: "2.5" }).success, true);
  assert.equal(interpretar({ cantidadHoras: "1.333" }).success, false);
});

test("las observaciones vacías se guardan como nulas", () => {
  const vacias = interpretar({ observaciones: "   " });
  const escritas = interpretar({ observaciones: " Apoyo coordinado con biblioteca " });

  assert.ok(vacias.success && escritas.success);
  assert.equal(vacias.data.observaciones, null);
  assert.equal(escritas.data.observaciones, "Apoyo coordinado con biblioteca");
});

test("las observaciones pueden omitirse del cuerpo", () => {
  const cuerpo = cuerpoValido();
  delete cuerpo.observaciones;

  const resultado = esquemaRegistroHoraAdmin.safeParse(cuerpo);

  assert.ok(resultado.success);
  assert.equal(resultado.data.observaciones, null);
});

test("el cuerpo no puede indicar el estado ni la acreditación del registro", () => {
  const resultado = interpretar({
    estado: "ACREDITADA",
    fechaAcreditacion: "2026-10-10",
    acreditadoPor: 1,
  });

  assert.ok(resultado.success);
  const campos = Object.keys(resultado.data);
  assert.equal(campos.includes("estado"), false);
  assert.equal(campos.includes("fechaAcreditacion"), false);
  assert.equal(campos.includes("acreditadoPor"), false);
});

test("cada campo del formulario tiene su etiqueta para el resumen de errores", () => {
  for (const campo of Object.keys(esquemaRegistroHoraAdmin.shape)) {
    assert.ok(ETIQUETAS_CAMPO_HORA_BECA[campo], campo);
  }
});

function usuario(roles: UsuarioSesion["roles"]): UsuarioSesion {
  return {
    idUsuario: 7,
    correo: "admin.prueba@uvg.edu.gt",
    estado: "ACTIVO",
    correoVerificado: true,
    nombreCompleto: "Administrador Prueba",
    roles,
  };
}

const acceso = (resultado: ResultadoGuardia) => async () => resultado;
const manejador = async () => Response.json({ ok: true });

test("sin sesión las rutas de horas beca responden 401", async () => {
  const ruta = protegerConAcceso(acceso({ tipo: "sin_sesion" }), [ROLES.administrador], manejador);

  assert.equal((await ruta()).status, 401);
});

test("con sesión pero sin el rol responden 404 y no revelan la ruta", async () => {
  const ruta = protegerConAcceso(
    acceso({ tipo: "sin_permiso", usuario: usuario([ROLES.estudiante]) }),
    [ROLES.administrador],
    manejador
  );
  const respuesta = await ruta();

  assert.equal(respuesta.status, 404);
  assert.deepEqual(await respuesta.json(), { mensaje: "No encontrado." });
});

test("el rol de administrador alcanza las rutas de horas beca", async () => {
  const ruta = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.administrador]) }),
    [ROLES.administrador],
    manejador
  );

  assert.equal((await ruta()).status, 200);
});

test("el registro queda a nombre del administrador de la sesión", async () => {
  let recibido = 0;
  const ruta = protegerConAcceso(
    acceso({ tipo: "autorizado", usuario: usuario([ROLES.administrador]) }),
    [ROLES.administrador],
    async (usuarioSesion) => {
      recibido = usuarioSesion.idUsuario;
      return Response.json({ ok: true });
    }
  );

  await ruta();

  assert.equal(recibido, 7);
});
