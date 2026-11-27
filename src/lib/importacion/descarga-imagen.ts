import { lookup } from "node:dns/promises";

import { enlaceDirectoDeImagen } from "@/lib/importacion/enlace-imagen";
import type { ImagenSubida } from "@/lib/imagenes/proveedor-imagenes";
import {
  tamanoMaximoBytes,
  tipoPorContenido,
  validarImagen,
} from "@/lib/imagenes/validacion-imagen";

// Se reexporta porque el detector vivía aquí: quien ya lo importaba de este
// módulo lo sigue encontrando.
export { tipoPorContenido };

/**
 * Descarga de la imagen que viene como enlace en una hoja de Excel.
 *
 * La plantilla no puede llevar la foto adentro, así que lleva su enlace. El
 * servidor la baja una sola vez, al importar, y la guarda en el almacenamiento
 * de la plataforma: de ahí en adelante el evento ya no depende del Drive de
 * nadie. Si mañana cambian los permisos de la carpeta o se borra el archivo, la
 * cartelera sigue mostrando la imagen.
 */

export type ImagenDescargada = { ok: true; imagen: ImagenSubida } | { ok: false; mensaje: string };

export type OpcionesDescarga = {
  /** Se inyecta en las pruebas para no salir a la red. */
  buscar?: typeof fetch;
  /** Resolución de nombres; se inyecta en las pruebas. */
  resolver?: (anfitrion: string) => Promise<string[]>;
  maximoBytes?: number;
  milisegundosEspera?: number;
};

/** Rangos reservados de IPv4, en notación decimal por octetos. */
function ipv4Privada(direccion: string): boolean {
  const octetos = direccion.split(".").map(Number);
  if (octetos.length !== 4 || octetos.some((valor) => !Number.isInteger(valor))) return false;

  const [a, b] = octetos;

  return (
    a === 0 || // red local
    a === 10 || // privada
    a === 127 || // bucle local
    (a === 100 && b >= 64 && b <= 127) || // compartida del operador
    (a === 169 && b === 254) || // enlace local y metadatos de la nube
    (a === 172 && b >= 16 && b <= 31) || // privada
    (a === 192 && b === 168) || // privada
    (a === 192 && b === 0) || // protocolos
    (a === 198 && (b === 18 || b === 19)) || // pruebas de rendimiento
    a >= 224 // multidifusión y reservadas
  );
}

/** Direcciones que no deben alcanzarse desde el servidor. */
export function direccionPrivada(direccion: string): boolean {
  const limpia = direccion.toLocaleLowerCase("en-US").replace(/^\[|\]$/g, "");

  if (limpia.startsWith("::ffff:")) return ipv4Privada(limpia.slice(7));
  if (limpia === "::1" || limpia === "::") return true;
  // fc00::/7 (privadas) y fe80::/10 (enlace local).
  if (/^f[cd]/.test(limpia) || /^fe[89ab]/.test(limpia)) return true;

  return ipv4Privada(limpia);
}

const NOMBRES_INTERNOS = /(^|\.)(localhost|local|internal|localdomain)$/;

/**
 * Comprueba que el enlace salga a internet y no a la red del propio servidor.
 *
 * Un administrador podría pegar, sin saberlo, un enlace copiado de una
 * herramienta interna; descargarlo convertiría al servidor en un puente hacia
 * su propia red privada. Se resuelve el nombre y se rechaza cualquier dirección
 * reservada.
 */
export async function anfitrionPublico(
  anfitrion: string,
  resolver?: OpcionesDescarga["resolver"]
): Promise<boolean> {
  const nombre = anfitrion.toLocaleLowerCase("en-US").replace(/^\[|\]$/g, "");

  if (nombre === "" || NOMBRES_INTERNOS.test(nombre)) return false;
  // Una dirección escrita directamente no hace falta resolverla.
  if (/^[\d.]+$/.test(nombre) || nombre.includes(":")) return !direccionPrivada(nombre);

  try {
    const direcciones = resolver
      ? await resolver(nombre)
      : (await lookup(nombre, { all: true })).map((dato) => dato.address);

    return direcciones.length > 0 && direcciones.every((ip) => !direccionPrivada(ip));
  } catch {
    return false;
  }
}

/** Nombre de archivo con el que se guarda, tomado del enlace. */
function nombreDeArchivo(url: URL): string {
  const ultimo = url.pathname.split("/").filter(Boolean).pop() ?? "";

  return ultimo.length > 0 && ultimo.length <= 120 ? ultimo : "imagen";
}

const MENSAJE_NO_IMAGEN =
  "El enlace no devuelve una imagen. Compártelo como «cualquiera con el enlace» y usa el enlace del archivo, no el de la carpeta.";

/**
 * Baja la imagen a la que apunta el enlace.
 *
 * Nunca lanza: devuelve el problema en un mensaje pensado para que quien llenó
 * la hoja sepa qué corregir, porque termina en el reporte de la importación.
 */
export async function descargarImagen(
  enlace: string,
  opciones: OpcionesDescarga = {}
): Promise<ImagenDescargada> {
  const maximo = opciones.maximoBytes ?? tamanoMaximoBytes();
  const buscar = opciones.buscar ?? fetch;
  const directo = enlaceDirectoDeImagen(enlace.trim());

  let url: URL;

  try {
    url = new URL(directo);
  } catch {
    return { ok: false, mensaje: "El enlace de la imagen no es una dirección válida." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, mensaje: "El enlace de la imagen debe empezar con http:// o https://." };
  }

  if (!(await anfitrionPublico(url.hostname, opciones.resolver))) {
    return { ok: false, mensaje: "El enlace de la imagen no apunta a un sitio público." };
  }

  let respuesta: Response;

  try {
    respuesta = await buscar(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(opciones.milisegundosEspera ?? 15_000),
      headers: { Accept: "image/*,*/*" },
    });
  } catch {
    return {
      ok: false,
      mensaje: "No se pudo abrir el enlace de la imagen. Comprueba que siga disponible.",
    };
  }

  if (!respuesta.ok) {
    return {
      ok: false,
      mensaje:
        respuesta.status === 403 || respuesta.status === 401
          ? "El enlace de la imagen pide permiso. Compártelo como «cualquiera con el enlace»."
          : `El enlace de la imagen devolvió el error ${respuesta.status}.`,
    };
  }

  // Tras seguir las redirecciones el destino puede ser otro: se comprueba igual
  // que el original.
  const destino = respuesta.url && respuesta.url !== "" ? new URL(respuesta.url) : url;
  if (destino.hostname !== url.hostname) {
    if (!(await anfitrionPublico(destino.hostname, opciones.resolver))) {
      return { ok: false, mensaje: "El enlace de la imagen no apunta a un sitio público." };
    }
  }

  const declarado = Number(respuesta.headers.get("content-length"));
  if (Number.isFinite(declarado) && declarado > maximo) {
    return { ok: false, mensaje: mensajeDeTamano(maximo) };
  }

  let contenido: Buffer;

  try {
    contenido = Buffer.from(await respuesta.arrayBuffer());
  } catch {
    return { ok: false, mensaje: "La descarga de la imagen se interrumpió." };
  }

  if (contenido.length > maximo) return { ok: false, mensaje: mensajeDeTamano(maximo) };

  const tipo = tipoPorContenido(contenido);
  if (!tipo) return { ok: false, mensaje: MENSAJE_NO_IMAGEN };

  const validacion = validarImagen({ tipo, tamano: contenido.length }, maximo);
  if (!validacion.valida) return { ok: false, mensaje: validacion.mensaje };

  return {
    ok: true,
    imagen: {
      nombre: nombreDeArchivo(url),
      tipo,
      // Se copia a un ArrayBuffer propio: el del Buffer puede ser una vista de
      // un bloque mayor reutilizado por Node.
      contenido: contenido.buffer.slice(
        contenido.byteOffset,
        contenido.byteOffset + contenido.byteLength
      ) as ArrayBuffer,
    },
  };
}

function mensajeDeTamano(maximo: number): string {
  return `La imagen del enlace pesa más de ${Math.round(maximo / (1024 * 1024))} MB.`;
}
