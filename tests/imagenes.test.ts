import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ProveedorImagenesMemoria } from "../src/lib/imagenes/proveedor-imagenes";
import { TIPOS_PERMITIDOS, validarImagen } from "../src/lib/imagenes/validacion-imagen";

const TRES_MB = 3 * 1024 * 1024;

test("se aceptan los formatos JPEG, PNG y WebP", () => {
  for (const tipo of TIPOS_PERMITIDOS) {
    assert.equal(validarImagen({ tipo, tamano: 1024 }, TRES_MB).valida, true);
  }
});

test("se rechaza cualquier otro formato", () => {
  for (const tipo of ["image/gif", "application/pdf", "text/html", ""]) {
    assert.equal(validarImagen({ tipo, tamano: 1024 }, TRES_MB).valida, false);
  }
});

test("una imagen del tamaño máximo exacto se acepta", () => {
  assert.equal(validarImagen({ tipo: "image/png", tamano: TRES_MB }, TRES_MB).valida, true);
});

test("una imagen más grande que el máximo se rechaza con su mensaje", () => {
  const resultado = validarImagen({ tipo: "image/png", tamano: TRES_MB + 1 }, TRES_MB);

  assert.equal(resultado.valida, false);
  assert.match(resultado.valida === false ? resultado.mensaje : "", /3 MB/);
});

test("un archivo vacío se rechaza", () => {
  assert.equal(validarImagen({ tipo: "image/png", tamano: 0 }, TRES_MB).valida, false);
});

test("el proveedor de memoria devuelve una dirección utilizable sin salir a la red", async () => {
  const proveedor = new ProveedorImagenesMemoria();

  const url = await proveedor.subir({
    nombre: "afiche.png",
    tipo: "image/png",
    contenido: new Uint8Array([1, 2, 3]).buffer,
  });

  assert.match(url, /^data:image\/png;base64,/);
  assert.equal(proveedor.subidas.length, 1);
});

test("el proveedor de disco solo acepta los formatos con extensión conocida", async () => {
  const { ProveedorImagenesDisco } = await import("../src/lib/imagenes/proveedor-imagenes");
  const proveedor = new ProveedorImagenesDisco(
    path.join(os.tmpdir(), `aeuvg-imagenes-${Date.now()}`)
  );

  await assert.rejects(
    proveedor.subir({
      nombre: "afiche.gif",
      tipo: "image/gif",
      contenido: new Uint8Array([1]).buffer,
    })
  );
});

test("el proveedor de disco guarda el archivo y devuelve una ruta servible", async () => {
  const { ProveedorImagenesDisco } = await import("../src/lib/imagenes/proveedor-imagenes");
  const carpeta = path.join(os.tmpdir(), `aeuvg-imagenes-${Date.now()}-ok`);
  const proveedor = new ProveedorImagenesDisco(carpeta);

  const url = await proveedor.subir({
    nombre: "afiche.png",
    tipo: "image/png",
    contenido: new Uint8Array([137, 80, 78, 71]).buffer,
  });

  // El nombre lo genera el servidor: nunca se reutiliza el del navegador.
  assert.match(url, /^\/api\/imagenes\/[0-9a-f]{32}\.png$/);
  assert.doesNotMatch(url, /afiche/);

  const archivo = path.join(carpeta, url.split("/").pop()!);
  assert.equal((await fs.stat(archivo)).size, 4);

  await fs.rm(carpeta, { recursive: true, force: true });
});
