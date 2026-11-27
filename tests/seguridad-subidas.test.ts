import assert from "node:assert/strict";
import test from "node:test";

import {
  tipoPorContenido,
  validarContenidoImagen,
  validarImagen,
} from "@/lib/imagenes/validacion-imagen";

/**
 * Validación de lo que se sube.
 *
 * El punto de estas pruebas es que el encabezado que manda quien sube no
 * decide nada: lo que decide son los primeros bytes del archivo. Sin eso, un
 * archivo cualquiera con el encabezado de una imagen quedaría guardado y
 * servido por el propio dominio.
 */

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const PNG = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(16)]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from("WEBP", "latin1"),
  Buffer.alloc(16),
]);

test("reconoce los tres formatos que admite la plataforma", () => {
  assert.equal(tipoPorContenido(JPEG), "image/jpeg");
  assert.equal(tipoPorContenido(PNG), "image/png");
  assert.equal(tipoPorContenido(WEBP), "image/webp");
});

test("un guion disfrazado de imagen se rechaza", () => {
  const guion = Buffer.from("<script>alert(1)</script>                 ", "utf8");

  const resultado = validarContenidoImagen(guion);

  assert.equal(resultado.valida, false);
});

test("un HTML entero tampoco pasa por imagen", () => {
  const html = Buffer.from("<!doctype html><html><body>hola</body></html>", "utf8");

  assert.equal(validarContenidoImagen(html).valida, false);
});

test("un archivo demasiado corto para tener firma se rechaza", () => {
  assert.equal(tipoPorContenido(Buffer.from([0xff, 0xd8])), null);
  assert.equal(validarContenidoImagen(Buffer.from([0xff, 0xd8])).valida, false);
});

test("una imagen de verdad pasa y dice cuál es su formato", () => {
  const resultado = validarContenidoImagen(PNG);

  assert.equal(resultado.valida, true);
  assert.equal(resultado.valida && resultado.tipo, "image/png");
});

test("el formato que se guarda sale del contenido, no de lo que declararon", () => {
  // Un PNG enviado como si fuera JPEG: lo que vale es lo que trae dentro.
  const resultado = validarContenidoImagen(PNG);

  assert.equal(resultado.valida && resultado.tipo, "image/png");
});

test("sigue valiendo el tope de tamaño y el archivo vacío", () => {
  assert.equal(validarImagen({ tipo: "image/png", tamano: 0 }).valida, false);
  assert.equal(validarImagen({ tipo: "image/png", tamano: 50 }, 10).valida, false);
  assert.equal(validarImagen({ tipo: "application/pdf", tamano: 10 }, 100).valida, false);
  assert.equal(validarImagen({ tipo: "image/png", tamano: 10 }, 100).valida, true);
});
