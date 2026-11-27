import assert from "node:assert/strict";
import test from "node:test";

import { origenPermitido } from "@/lib/seguridad/origen";

/**
 * Comprobación del origen.
 *
 * Lo que se prueba es que una petición lanzada desde otra página no se atienda
 * —que es el ataque— y que las del propio sitio sigan pasando, incluidas las
 * que llegan por el proxy con el anfitrión público en otra cabecera.
 */

function peticion(
  metodo: string,
  cabeceras: Record<string, string>,
  url = "https://aeuvg.example/api/eventos"
) {
  return new Request(url, { method: metodo, headers: cabeceras });
}

test("una escritura desde el propio sitio pasa", () => {
  const solicitud = peticion("POST", {
    origin: "https://aeuvg.example",
    host: "aeuvg.example",
  });

  assert.equal(origenPermitido(solicitud), true);
});

test("una escritura lanzada desde otra página se rechaza", () => {
  const solicitud = peticion("POST", {
    origin: "https://sitio-malicioso.example",
    host: "aeuvg.example",
  });

  assert.equal(origenPermitido(solicitud), false);
});

test("un subdominio parecido tampoco cuenta como el propio sitio", () => {
  const solicitud = peticion("POST", {
    origin: "https://aeuvg.example.malicioso.com",
    host: "aeuvg.example",
  });

  assert.equal(origenPermitido(solicitud), false);
});

test("detrás del proxy se compara con el anfitrión público", () => {
  const solicitud = peticion("POST", {
    origin: "https://aeuvg.example",
    "x-forwarded-host": "aeuvg.example",
    host: "contenedor.interno:3000",
  });

  assert.equal(origenPermitido(solicitud), true);
});

test("las lecturas no se tocan: exigirlo rompería enlaces legítimos", () => {
  const solicitud = peticion("GET", {
    origin: "https://sitio-malicioso.example",
    host: "aeuvg.example",
  });

  assert.equal(origenPermitido(solicitud), true);
});

test("sin cabecera de origen se deja pasar: no es el ataque del que protege", () => {
  assert.equal(origenPermitido(peticion("POST", { host: "aeuvg.example" })), true);
});

test("un origen que no es una dirección válida se rechaza", () => {
  const solicitud = peticion("POST", { origin: "no-es-una-direccion", host: "aeuvg.example" });

  assert.equal(origenPermitido(solicitud), false);
});

test("sin saber a qué anfitrión llegó, una escritura con origen no pasa", () => {
  const solicitud = new Request("https://aeuvg.example/api/eventos", {
    method: "POST",
    headers: { origin: "https://aeuvg.example" },
  });
  // `Request` pone el host solo si se le da; aquí se comprueba el caso en que
  // no llega ninguno.
  solicitud.headers.delete("host");

  assert.equal(origenPermitido(solicitud), false);
});

test("los demás métodos que escriben se comprueban igual", () => {
  for (const metodo of ["PUT", "PATCH", "DELETE"]) {
    const solicitud = peticion(metodo, {
      origin: "https://sitio-malicioso.example",
      host: "aeuvg.example",
    });

    assert.equal(origenPermitido(solicitud), false, `${metodo} debería rechazarse`);
  }
});
