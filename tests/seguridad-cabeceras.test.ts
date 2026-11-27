import assert from "node:assert/strict";
import test from "node:test";

import { cabecerasFijas, generarNonce, politicaDeContenidos } from "@/lib/seguridad/cabeceras";

/**
 * Cabeceras de seguridad.
 *
 * Lo que se comprueba es que las directivas que de verdad protegen estén
 * puestas y no se aflojen sin que nadie se entere: un `unsafe-inline` que se
 * cuele en los guiones, o un `frame-ancestors` que desaparezca, dejan de
 * proteger sin romper nada visible.
 */

function directivas(politica: string): Map<string, string> {
  return new Map(
    politica.split("; ").map((parte) => {
      const [nombre, ...valores] = parte.split(" ");
      return [nombre, valores.join(" ")];
    })
  );
}

test("en producción se exige HTTPS en las siguientes visitas", () => {
  const nombres = cabecerasFijas(true).map((c) => c.key);

  assert.ok(nombres.includes("Strict-Transport-Security"));
});

test("en desarrollo no se fuerza HTTPS, que allí no existe", () => {
  const nombres = cabecerasFijas(false).map((c) => c.key);

  assert.equal(nombres.includes("Strict-Transport-Security"), false);
});

test("están las cabeceras que impiden adivinar el tipo y enmarcar el sitio", () => {
  const fijas = new Map(cabecerasFijas(true).map((c) => [c.key, c.value]));

  assert.equal(fijas.get("X-Content-Type-Options"), "nosniff");
  assert.equal(fijas.get("X-Frame-Options"), "DENY");
  assert.equal(fijas.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(fijas.get("Permissions-Policy") ?? "", /camera=\(\)/);
});

test("la política solo deja correr los guiones marcados con el número de la respuesta", () => {
  const partes = directivas(politicaDeContenidos("abc123", true));

  assert.match(partes.get("script-src") ?? "", /'nonce-abc123'/);
  assert.match(partes.get("script-src") ?? "", /'strict-dynamic'/);
  // Lo que invalidaría la protección entera.
  assert.doesNotMatch(partes.get("script-src") ?? "", /'unsafe-inline'/);
});

test("en producción no se admite evaluar código", () => {
  const partes = directivas(politicaDeContenidos("abc123", true));

  assert.doesNotMatch(partes.get("script-src") ?? "", /'unsafe-eval'/);
});

test("en desarrollo sí, porque React lo usa para reconstruir los errores", () => {
  const partes = directivas(politicaDeContenidos("abc123", false));

  assert.match(partes.get("script-src") ?? "", /'unsafe-eval'/);
});

test("nada puede incrustar el sitio ni cargar objetos", () => {
  const partes = directivas(politicaDeContenidos("abc123", true));

  assert.equal(partes.get("frame-ancestors"), "'none'");
  assert.equal(partes.get("object-src"), "'none'");
  assert.equal(partes.get("base-uri"), "'self'");
  assert.equal(partes.get("form-action"), "'self'");
  assert.equal(partes.get("default-src"), "'self'");
});

test("las imágenes solo salen del sitio y del almacenamiento configurado", () => {
  const imagenes = directivas(politicaDeContenidos("abc123", true)).get("img-src") ?? "";

  assert.match(imagenes, /'self'/);
  assert.match(imagenes, /https:\/\/res\.cloudinary\.com/);
  assert.doesNotMatch(imagenes, /\*/);
});

test("cada respuesta lleva un número distinto", () => {
  const numeros = new Set(Array.from({ length: 50 }, () => generarNonce()));

  assert.equal(numeros.size, 50);
  assert.ok(generarNonce().length >= 24);
});
