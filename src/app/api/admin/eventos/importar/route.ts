import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { COLUMNAS_IMPORTACION_EVENTOS } from "@/lib/eventos/columnas-importacion";
import { crearServicioImportacionEventos } from "@/lib/eventos/crear-servicio-importacion-eventos";
import {
  leerSolicitudDeArchivo,
  respuestaDeProblema,
  sinCache,
} from "@/lib/importacion/solicitud-archivo";

export const runtime = "nodejs";

/**
 * Revisa o importa un archivo de eventos.
 *
 * El parámetro "accion" decide cuál de las dos operaciones corre. La revisión no
 * escribe nada ni sale a la red: es la que alimenta la pantalla de validación
 * previa, para que AEUVG vea lo que va a pasar antes de que pase.
 */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const lectura = await leerSolicitudDeArchivo(solicitud);
  if (!lectura.ok) return lectura.respuesta;

  try {
    const contenido = Buffer.from(await lectura.archivo.arrayBuffer());
    const servicio = crearServicioImportacionEventos();

    const resultado =
      lectura.accion === "importar"
        ? await servicio.importar(contenido, usuario.idUsuario)
        : await servicio.revisar(contenido);

    const problema = respuestaDeProblema(resultado, COLUMNAS_IMPORTACION_EVENTOS);
    if (problema) return problema;

    if (resultado.tipo === "sin_filas_nuevas") {
      return Response.json(
        {
          ...resultado,
          mensaje:
            resultado.repetidas.length > 0 && resultado.fallidas === 0
              ? "Todos los eventos del archivo ya estaban creados, así que no se agregó ninguno."
              : "Ninguna fila del archivo se pudo guardar. Revisa la lista de problemas.",
        },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json(resultado, { headers: sinCache });
  } catch (error) {
    console.error("Fallo al importar eventos:", error instanceof Error ? error.message : error);

    return Response.json(
      { mensaje: "No se pudo procesar el archivo. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
