import type { ProblemaArchivo } from "@/lib/importacion/reporte";

/**
 * Lo que comparten las rutas que reciben un Excel.
 *
 * Las tres secciones que se cargan por archivo comprueban lo mismo antes de
 * mirar el contenido: que venga un archivo, que no sea enorme y que parezca un
 * Excel. Tenerlo aquí evita que cada ruta lo escriba a su manera y que los
 * mensajes se contradigan entre secciones.
 */

export const sinCache = { "Cache-Control": "no-store" };

/** Tamaño máximo del archivo. Una hoja de cientos de filas no llega a tanto. */
export const MAXIMO_BYTES_ARCHIVO = 5 * 1024 * 1024;

const TIPOS_EXCEL = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export type LecturaSolicitud =
  { ok: true; archivo: File; accion: "revisar" | "importar" } | { ok: false; respuesta: Response };

/** Toma el archivo y la acción del formulario, o devuelve la respuesta del error. */
export async function leerSolicitudDeArchivo(solicitud: Request): Promise<LecturaSolicitud> {
  const formulario = await solicitud.formData().catch(() => null);
  const archivo = formulario?.get("archivo");

  if (!(archivo instanceof File)) {
    return {
      ok: false,
      respuesta: Response.json(
        { mensaje: "Adjunta el archivo de Excel que quieres cargar." },
        { status: 422, headers: sinCache }
      ),
    };
  }

  if (archivo.size > MAXIMO_BYTES_ARCHIVO) {
    return {
      ok: false,
      respuesta: Response.json(
        { mensaje: "El archivo supera los 5 MB permitidos." },
        { status: 413, headers: sinCache }
      ),
    };
  }

  // El tipo que informa el navegador es una pista, no una garantía: la lectura
  // del contenido es la que decide de verdad si el archivo sirve.
  if (archivo.type && !TIPOS_EXCEL.includes(archivo.type)) {
    return {
      ok: false,
      respuesta: Response.json(
        { mensaje: "El archivo debe ser un Excel con extensión .xlsx." },
        { status: 422, headers: sinCache }
      ),
    };
  }

  return {
    ok: true,
    archivo,
    accion: String(formulario?.get("accion") ?? "revisar") === "importar" ? "importar" : "revisar",
  };
}

/**
 * Traduce un problema de lectura a su respuesta.
 *
 * Devuelve null cuando el resultado no es un problema del archivo, de modo que
 * la ruta siga con el reporte normal.
 */
export function respuestaDeProblema(
  resultado: { tipo: string },
  columnasEsperadas: readonly string[]
): Response | null {
  const problema = resultado as ProblemaArchivo;

  if (problema.tipo === "sin_columnas") {
    return Response.json(
      {
        mensaje:
          `Al archivo le faltan columnas: ${problema.faltantes.join(", ")}. ` +
          `Se esperan estas: ${columnasEsperadas.join(", ")}.`,
      },
      { status: 422, headers: sinCache }
    );
  }

  if (problema.tipo === "demasiadas_filas") {
    return Response.json(
      {
        mensaje: `El archivo trae ${problema.total} filas y el máximo son ${problema.maximo}. Divídelo en varios archivos.`,
      },
      { status: 413, headers: sinCache }
    );
  }

  if (problema.tipo === "ilegible") {
    return Response.json(
      { mensaje: "No se pudo leer el archivo. Comprueba que sea un Excel con extensión .xlsx." },
      { status: 422, headers: sinCache }
    );
  }

  return null;
}

/** Respuesta de una descarga de plantilla. */
export function respuestaDePlantilla(contenido: Buffer, nombre: string): Response {
  return new Response(contenido as BodyInit, {
    headers: {
      ...sinCache,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
