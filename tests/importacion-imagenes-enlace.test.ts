import assert from "node:assert/strict";
import test from "node:test";

import {
  anfitrionPublico,
  descargarImagen,
  direccionPrivada,
  tipoPorContenido,
} from "../src/lib/importacion/descarga-imagen";
import { enlaceDirectoDeImagen, esEnlaceParaCompartir } from "../src/lib/importacion/enlace-imagen";
import { GuardadoImagenesPorEnlace } from "../src/lib/importacion/guardado-imagenes";
import type { ImagenSubida, ProveedorImagenes } from "../src/lib/imagenes/proveedor-imagenes";

/** PNG mínimo: la firma del formato más relleno para pasar de 12 bytes. */
const PNG = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32, 7)]);

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 3)]);

const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.alloc(4, 0),
  Buffer.from("WEBP", "latin1"),
  Buffer.alloc(16, 1),
]);

/** Resolución de nombres de prueba: todo apunta a una dirección pública. */
const resolverPublico = async () => ["181.174.1.1"];

function respuesta(
  cuerpo: Buffer | string,
  opciones: { estado?: number; tipo?: string; tamano?: number } = {}
): typeof fetch {
  return (async () => {
    const encabezados = new Headers();
    if (opciones.tipo) encabezados.set("content-type", opciones.tipo);
    if (opciones.tamano !== undefined) {
      encabezados.set("content-length", String(opciones.tamano));
    }

    return new Response(cuerpo as unknown as BodyInit, {
      status: opciones.estado ?? 200,
      headers: encabezados,
    });
  }) as unknown as typeof fetch;
}

class ProveedorFalso implements ProveedorImagenes {
  readonly subidas: ImagenSubida[] = [];

  async subir(imagen: ImagenSubida): Promise<string> {
    this.subidas.push(imagen);
    return `/api/imagenes/${this.subidas.length}.png`;
  }
}

test("un enlace para compartir de Google Drive se traduce al de descarga", () => {
  assert.equal(
    enlaceDirectoDeImagen("https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing"),
    "https://drive.usercontent.google.com/download?id=1AbCdEfGhIjK&export=download"
  );
  assert.equal(
    enlaceDirectoDeImagen("https://drive.google.com/open?id=1AbCdEfGhIjK"),
    "https://drive.usercontent.google.com/download?id=1AbCdEfGhIjK&export=download"
  );
});

test("un enlace de OneDrive se traduce al recurso compartido", () => {
  const traducido = enlaceDirectoDeImagen("https://1drv.ms/i/s!AbCdEfGhIjKlMnOp");

  assert.ok(traducido.startsWith("https://api.onedrive.com/v1.0/shares/u!"));
  assert.ok(traducido.endsWith("/root/content"));
  // La codificación no lleva relleno ni caracteres que rompan la dirección.
  assert.ok(!traducido.includes("="));
  assert.ok(!traducido.includes("+"));
});

test("un enlace de SharePoint o de Dropbox pide la descarga", () => {
  assert.match(
    enlaceDirectoDeImagen("https://uvg-my.sharepoint.com/:i:/g/personal/abc/Foto.jpg?e=xyz"),
    /download=1/
  );
  assert.match(enlaceDirectoDeImagen("https://www.dropbox.com/s/abc/afiche.png?dl=0"), /raw=1/);
  assert.ok(
    !enlaceDirectoDeImagen("https://www.dropbox.com/s/abc/afiche.png?dl=0").includes("dl=")
  );
});

test("un enlace que ya apunta al archivo se deja igual", () => {
  const directo = "https://ejemplo.com/afiches/feria.jpg";

  assert.equal(enlaceDirectoDeImagen(directo), directo);
  assert.equal(esEnlaceParaCompartir(directo), false);
  assert.equal(esEnlaceParaCompartir("https://drive.google.com/file/d/1AbCdEfGhIjK/view"), true);
  assert.equal(enlaceDirectoDeImagen("no es una direccion"), "no es una direccion");
});

test("el formato se reconoce por los primeros bytes y no por lo que diga el servidor", () => {
  assert.equal(tipoPorContenido(PNG), "image/png");
  assert.equal(tipoPorContenido(JPEG), "image/jpeg");
  assert.equal(tipoPorContenido(WEBP), "image/webp");
  assert.equal(tipoPorContenido(Buffer.from("<!DOCTYPE html><html></html>")), null);
  assert.equal(tipoPorContenido(Buffer.alloc(4)), null);
});

test("las direcciones de la red interna se reconocen como privadas", () => {
  for (const privada of [
    "127.0.0.1",
    "10.0.0.5",
    "192.168.1.10",
    "172.16.0.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
  ]) {
    assert.equal(direccionPrivada(privada), true, privada);
  }

  for (const publica of ["181.174.1.1", "8.8.8.8", "2606:4700::1111"]) {
    assert.equal(direccionPrivada(publica), false, publica);
  }
});

test("un enlace al propio servidor no se descarga", async () => {
  assert.equal(await anfitrionPublico("localhost"), false);
  assert.equal(await anfitrionPublico("base.internal"), false);
  assert.equal(await anfitrionPublico("127.0.0.1"), false);
  assert.equal(await anfitrionPublico("drive.google.com", async () => ["10.1.2.3"]), false);
  assert.equal(await anfitrionPublico("drive.google.com", resolverPublico), true);
});

test("la imagen se descarga y se reconoce su formato", async () => {
  const resultado = await descargarImagen("https://ejemplo.com/afiche.png", {
    buscar: respuesta(PNG, { tipo: "application/octet-stream" }),
    resolver: resolverPublico,
  });

  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.imagen.tipo, "image/png");
  assert.equal(resultado.imagen.nombre, "afiche.png");
  assert.equal(resultado.imagen.contenido.byteLength, PNG.length);
});

test("un enlace que devuelve una página web se reporta con qué corregir", async () => {
  const resultado = await descargarImagen("https://drive.google.com/file/d/1AbCdEfGhIjK/view", {
    buscar: respuesta("<!DOCTYPE html><html><body>Inicia sesión</body></html>", {
      tipo: "text/html",
    }),
    resolver: resolverPublico,
  });

  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.match(resultado.mensaje, /cualquiera con el enlace/);
});

test("un enlace sin permiso lo dice en lugar de dar un número de error", async () => {
  const resultado = await descargarImagen("https://ejemplo.com/afiche.png", {
    buscar: respuesta("", { estado: 403 }),
    resolver: resolverPublico,
  });

  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.match(resultado.mensaje, /pide permiso/);
});

test("una imagen más grande que el máximo se rechaza por el encabezado y por su tamaño", async () => {
  const porEncabezado = await descargarImagen("https://ejemplo.com/a.png", {
    buscar: respuesta(PNG, { tamano: 9_000_000 }),
    resolver: resolverPublico,
    maximoBytes: 1024,
  });
  const porContenido = await descargarImagen("https://ejemplo.com/a.png", {
    buscar: respuesta(PNG),
    resolver: resolverPublico,
    maximoBytes: 10,
  });

  assert.equal(porEncabezado.ok, false);
  assert.equal(porContenido.ok, false);
  if (porContenido.ok) return;
  assert.match(porContenido.mensaje, /pesa más de/);
});

test("un enlace que no es http no se descarga", async () => {
  const resultado = await descargarImagen("ftp://ejemplo.com/a.png", { resolver: resolverPublico });

  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.match(resultado.mensaje, /http/);
});

test("la misma imagen repetida en varias filas se descarga una sola vez", async () => {
  let descargas = 0;
  const proveedor = new ProveedorFalso();
  const guardado = new GuardadoImagenesPorEnlace(proveedor, {
    resolver: resolverPublico,
    buscar: (async () => {
      descargas += 1;
      return new Response(PNG as unknown as BodyInit);
    }) as unknown as typeof fetch,
  });

  const enlace = "https://ejemplo.com/logo.png";
  const primera = await guardado.guardar(enlace);
  const segunda = await guardado.guardar(enlace);

  assert.equal(descargas, 1);
  assert.equal(proveedor.subidas.length, 1);
  assert.deepEqual(primera, segunda);
  assert.equal(primera.tipo, "guardada");
});

test("sin almacenamiento configurado se conserva el enlace, pero traducido", async () => {
  const guardado = new GuardadoImagenesPorEnlace(null);

  const resultado = await guardado.guardar("https://drive.google.com/file/d/1AbCdEfGhIjK/view");

  assert.equal(resultado.tipo, "conservada");
  if (resultado.tipo !== "conservada") return;
  assert.match(resultado.url, /drive\.usercontent\.google\.com/);
});
