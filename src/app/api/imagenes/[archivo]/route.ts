import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { carpetaDeImagenes } from "@/lib/imagenes/proveedor-imagenes";

export const runtime = "nodejs";

/**
 * Nombres que el servidor genera al subir una imagen: 32 dígitos hexadecimales
 * y una extensión conocida. Cualquier otra cosa se rechaza sin tocar el disco,
 * de modo que no haya forma de pedir un archivo fuera de la carpeta.
 */
const NOMBRE_VALIDO = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

const TIPO_POR_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const noEncontrada = () => new Response(null, { status: 404 });

/**
 * Sirve las imágenes guardadas en el volumen persistente.
 *
 * Se entregan desde una ruta propia y no desde public/ porque el volumen se
 * monta fuera del build: los archivos que sube AEUVG no existen cuando se
 * construye la imagen del contenedor.
 */
export async function GET(_solicitud: Request, contexto: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await contexto.params;

  if (!NOMBRE_VALIDO.test(archivo)) return noEncontrada();

  // turbopackIgnore: ver el comentario del proveedor de disco.
  const ruta = path.join(/* turbopackIgnore: true */ carpetaDeImagenes(), archivo);
  const extension = archivo.split(".").pop() ?? "";

  try {
    const informacion = await stat(/* turbopackIgnore: true */ ruta);
    if (!informacion.isFile()) return noEncontrada();

    const cuerpo = Readable.toWeb(
      createReadStream(/* turbopackIgnore: true */ ruta)
    ) as ReadableStream<Uint8Array>;

    return new Response(cuerpo, {
      headers: {
        "Content-Type": TIPO_POR_EXTENSION[extension] ?? "application/octet-stream",
        "Content-Length": String(informacion.size),
        // El nombre del archivo es único e irrepetible: cambiar la imagen de un
        // evento genera otro nombre, así que puede cachearse indefinidamente.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return noEncontrada();
  }
}
