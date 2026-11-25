import assert from "node:assert/strict";
import test from "node:test";

import { aplicarEventoDeActividad } from "../src/lib/horas-beca/actividad-evento";
import { esquemaRegistroHoraAdmin } from "../src/validators/hora-beca-admin";

const REGISTRO = {
  carnet: "24852",
  nombreEstudiante: "Ana Lucía Morales",
  fechaActividad: "2026-10-09",
  horarioApoyo: "14:00-16:00",
  descripcionActividad: "Feria",
  cantidadHoras: "2",
};

test("el evento de la actividad es opcional y vacío equivale a no tenerlo", () => {
  assert.equal(esquemaRegistroHoraAdmin.parse(REGISTRO).idEvento, null);
  assert.equal(esquemaRegistroHoraAdmin.parse({ ...REGISTRO, idEvento: "" }).idEvento, null);
  assert.equal(esquemaRegistroHoraAdmin.parse({ ...REGISTRO, idEvento: "7" }).idEvento, 7);
  assert.equal(esquemaRegistroHoraAdmin.safeParse({ ...REGISTRO, idEvento: "-1" }).success, false);
});

test("con evento, la descripción de la actividad es el nombre del evento", () => {
  const resultado = aplicarEventoDeActividad(
    { idEvento: 7, descripcionActividad: "Lo que haya escrito el navegador" },
    { idEvento: 7, nombre: "Feria de Voluntariado 2026" }
  );

  assert.deepEqual(resultado, {
    valido: true,
    datos: { idEvento: 7, descripcionActividad: "Feria de Voluntariado 2026" },
  });
});

test("sin evento, la descripción escrita se conserva", () => {
  const resultado = aplicarEventoDeActividad(
    { idEvento: null, descripcionActividad: "Apoyo en la biblioteca" },
    null
  );

  assert.deepEqual(resultado, {
    valido: true,
    datos: { idEvento: null, descripcionActividad: "Apoyo en la biblioteca" },
  });
});

test("un evento que no existe o no se puede elegir detiene el registro", () => {
  const resultado = aplicarEventoDeActividad({ idEvento: 99, descripcionActividad: "Feria" }, null);

  assert.ok(!resultado.valido && resultado.errores.idEvento);
});
