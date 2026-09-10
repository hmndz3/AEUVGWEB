import assert from "node:assert/strict";
import test from "node:test";

import {
  crearEsquemaRegistro,
  normalizarCorreo,
  perteneceAlDominio,
} from "../src/validators/registro";

const DOMINIO = "uvg.edu.gt";
const esquema = crearEsquemaRegistro(DOMINIO);

function datosValidos(cambios: Record<string, unknown> = {}) {
  return {
    nombreCompleto: "Estudiante Prueba",
    carnet: "24089",
    correo: "estudiante.prueba@uvg.edu.gt",
    idFacultad: 1,
    idCarrera: 3,
    contrasena: "PruebaSegura1!",
    confirmarContrasena: "PruebaSegura1!",
    aceptaTerminos: true,
    ...cambios,
  };
}

test("acepta un registro que cumple todas las reglas", () => {
  assert.equal(esquema.safeParse(datosValidos()).success, true);
});

test("el correo se normaliza a minúsculas y sin espacios", () => {
  assert.equal(
    normalizarCorreo("  Estudiante.Prueba@UVG.EDU.GT  "),
    "estudiante.prueba@uvg.edu.gt"
  );

  const resultado = esquema.safeParse(datosValidos({ correo: "  Estudiante@UVG.EDU.GT " }));

  assert.equal(resultado.success, true);
  if (resultado.success) assert.equal(resultado.data.correo, "estudiante@uvg.edu.gt");
});

test("solo se admite el dominio institucional configurado", () => {
  assert.equal(perteneceAlDominio("alguien@uvg.edu.gt", DOMINIO), true);
  assert.equal(perteneceAlDominio("alguien@gmail.com", DOMINIO), false);
  // Un dominio que termina igual pero no coincide debe rechazarse.
  assert.equal(perteneceAlDominio("alguien@falso-uvg.edu.gt", DOMINIO), false);
  assert.equal(perteneceAlDominio("alguien@uvg.edu.gt.example", DOMINIO), false);
  assert.equal(perteneceAlDominio("@uvg.edu.gt", DOMINIO), false);
});

test("el carnet debe tener exactamente cinco dígitos", () => {
  assert.equal(esquema.safeParse(datosValidos({ carnet: "2408" })).success, false);
  assert.equal(esquema.safeParse(datosValidos({ carnet: "240899" })).success, false);
  assert.equal(esquema.safeParse(datosValidos({ carnet: "24O89" })).success, false);
  assert.equal(esquema.safeParse(datosValidos({ carnet: "24089" })).success, true);
});

test("la facultad y la carrera deben venir como identificadores positivos", () => {
  assert.equal(esquema.safeParse(datosValidos({ idFacultad: 0 })).success, false);
  assert.equal(esquema.safeParse(datosValidos({ idCarrera: -1 })).success, false);
  // El formulario las envía como texto, así que deben admitirse convertidas.
  assert.equal(esquema.safeParse(datosValidos({ idFacultad: "1", idCarrera: "3" })).success, true);
});

test("la contraseña exige minúscula, mayúscula, número y símbolo", () => {
  const casos = ["Corta1!", "minuscula1!", "MAYUSCULA1!", "SinNumero!!", "SinSimbolo11"];

  for (const contrasena of casos) {
    const resultado = esquema.safeParse(
      datosValidos({ contrasena, confirmarContrasena: contrasena })
    );
    assert.equal(resultado.success, false, `debería rechazar ${contrasena}`);
  }
});

test("la confirmación debe coincidir con la contraseña", () => {
  const resultado = esquema.safeParse(datosValidos({ confirmarContrasena: "OtraClave1!" }));

  assert.equal(resultado.success, false);
  if (!resultado.success) {
    assert.ok(
      resultado.error.issues.some((problema) => problema.path.includes("confirmarContrasena"))
    );
  }
});

test("no se puede registrar sin aceptar los términos", () => {
  assert.equal(esquema.safeParse(datosValidos({ aceptaTerminos: false })).success, false);
});
