import assert from "node:assert/strict";
import test from "node:test";

import { direccionDelCliente, Limitador } from "@/lib/seguridad/limitador";

/**
 * Límite de intentos.
 *
 * Es lo que separa «me equivoqué dos veces» de «estoy probando contraseñas en
 * bucle». Se prueba con un reloj fijo para que no dependa de cuánto tarde la
 * máquina en correr las pruebas.
 */

const BASE = new Date("2026-11-27T12:00:00.000Z");
const despues = (milisegundos: number) => new Date(BASE.getTime() + milisegundos);

test("deja pasar hasta el tope y corta al siguiente", () => {
  const limitador = new Limitador(3, 1_000);

  for (let i = 0; i < 3; i += 1) {
    assert.equal(limitador.permitir("clave", BASE), true);
    limitador.registrar("clave", BASE);
  }

  assert.equal(limitador.permitir("clave", BASE), false);
});

test("pasada la ventana se vuelve a permitir", () => {
  const limitador = new Limitador(1, 1_000);

  limitador.registrar("clave", BASE);

  assert.equal(limitador.permitir("clave", despues(999)), false);
  assert.equal(limitador.permitir("clave", despues(1_001)), true);
});

test("cada intento corre la ventana, así que insistir no acerca el desbloqueo", () => {
  const limitador = new Limitador(1, 1_000);

  limitador.registrar("clave", BASE);
  limitador.registrar("clave", despues(900));

  assert.equal(limitador.permitir("clave", despues(1_500)), false);
  assert.equal(limitador.permitir("clave", despues(1_901)), true);
});

test("las claves no se estorban entre sí", () => {
  const limitador = new Limitador(1, 1_000);

  limitador.registrar("una", BASE);

  assert.equal(limitador.permitir("una", BASE), false);
  assert.equal(limitador.permitir("otra", BASE), true);
});

test("entrar bien olvida los intentos fallidos", () => {
  const limitador = new Limitador(2, 1_000);

  limitador.registrar("clave", BASE);
  limitador.reiniciar("clave");

  assert.equal(limitador.permitir("clave", BASE), true);
});

test("dice cuántos segundos faltan, para poder responderlo en la cabecera", () => {
  const limitador = new Limitador(1, 60_000);

  limitador.registrar("clave", BASE);

  assert.equal(limitador.segundosDeEspera("clave", BASE), 60);
  assert.equal(limitador.segundosDeEspera("sin-intentos", BASE), 0);
});

test("la dirección sale de la cabecera del proxy, tomando la del cliente", () => {
  const solicitud = new Request("https://ejemplo.gt", {
    headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
  });

  assert.equal(direccionDelCliente(solicitud), "203.0.113.7");
});

test("sin cabeceras de proxy la petición no se queda sin clave", () => {
  assert.equal(direccionDelCliente(new Request("https://ejemplo.gt")), "desconocida");
});
