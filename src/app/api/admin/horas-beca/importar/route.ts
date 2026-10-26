import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioImportacion } from "@/lib/horas-beca/crear-servicio-importacion";
import { COLUMNAS_IMPORTACION } from "@/lib/horas-beca/importacion";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Tamaño máximo del archivo. Una hoja de miles de filas no llega a tanto. */
const MAXIMO_BYTES = 5 * 1024 * 1024;

const TIPOS_EXCEL = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

/** Traduce los problemas de lectura a una respuesta con su explicación. */
function respuestaDeProblema(resultado: { tipo: string } & Record<string, unknown>) {
  if (resultado.tipo === "sin_columnas") {
    return Response.json(
      {
        mensaje:
          `Al archivo le faltan columnas: ${(resultado.faltantes as string[]).join(", ")}. ` +
          `Se esperan estas: ${COLUMNAS_IMPORTACION.join(", ")}.`,
      },
      { status: 422, headers: sinCache }
    );
  }

  if (resultado.tipo === "demasiadas_filas") {
    return Response.json(
      {
        mensaje: `El archivo trae ${resultado.total} filas y el máximo son ${resultado.maximo}. Divídelo en varios archivos.`,
      },
      { status: 413, headers: sinCache }
    );
  }

  if (resultado.tipo === "ilegible") {
    return Response.json(
      { mensaje: "No se pudo leer el archivo. Comprueba que sea un Excel con extensión .xlsx." },
      { status: 422, headers: sinCache }
    );
  }

  return null;
}

/**
 * Revisa o importa un archivo de horas beca.
 *
 * El parámetro "accion" decide cuál de las dos operaciones corre. La revisión no
 * escribe nada: es la que alimenta la pantalla de validación previa, para que
 * AEUVG vea lo que va a pasar antes de que pase.
 */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const formulario = await solicitud.formData().catch(() => null);
  const archivo = formulario?.get("archivo");
  const accion = String(formulario?.get("accion") ?? "revisar");

  if (!(archivo instanceof File)) {
    return Response.json(
      { mensaje: "Adjunta el archivo de Excel que quieres cargar." },
      { status: 422, headers: sinCache }
    );
  }

  if (archivo.size > MAXIMO_BYTES) {
    return Response.json(
      { mensaje: "El archivo supera los 5 MB permitidos." },
      { status: 413, headers: sinCache }
    );
  }

  // El tipo que informa el navegador es una pista, no una garantía: la lectura
  // del contenido es la que decide de verdad si el archivo sirve.
  if (archivo.type && !TIPOS_EXCEL.includes(archivo.type)) {
    return Response.json(
      { mensaje: "El archivo debe ser un Excel con extensión .xlsx." },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const contenido = Buffer.from(await archivo.arrayBuffer());
    const servicio = crearServicioImportacion();

    const resultado =
      accion === "importar"
        ? await servicio.importar(contenido, archivo.name, usuario.idUsuario)
        : await servicio.revisar(contenido);

    const problema = respuestaDeProblema(resultado as never);
    if (problema) return problema;

    if (resultado.tipo === "sin_filas_validas") {
      return Response.json(
        {
          mensaje: "Ninguna fila del archivo pasó la validación, así que no se guardó nada.",
          errores: resultado.errores,
          total: resultado.total,
        },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json(resultado, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo procesar el archivo. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
