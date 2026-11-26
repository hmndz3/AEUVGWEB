import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import {
  leerSolicitudDeArchivo,
  respuestaDeProblema,
  sinCache,
} from "@/lib/importacion/solicitud-archivo";
import { COLUMNAS_CURSOS } from "@/lib/tutorias/columnas-importacion-cursos";
import { crearServicioImportacionCursos } from "@/lib/tutorias/crear-servicio-importacion-cursos";

export const runtime = "nodejs";

/** Revisa o importa un archivo de cursos. */
export const POST = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const lectura = await leerSolicitudDeArchivo(solicitud);
  if (!lectura.ok) return lectura.respuesta;

  try {
    const contenido = Buffer.from(await lectura.archivo.arrayBuffer());
    const servicio = crearServicioImportacionCursos();

    const resultado =
      lectura.accion === "importar"
        ? await servicio.importar(contenido)
        : await servicio.revisar(contenido);

    const problema = respuestaDeProblema(resultado, COLUMNAS_CURSOS);
    if (problema) return problema;

    if (resultado.tipo === "sin_filas_nuevas") {
      return Response.json(
        {
          ...resultado,
          mensaje:
            resultado.repetidas.length > 0 && resultado.fallidas === 0
              ? "Todos los cursos del archivo ya estaban en el catálogo, así que no se agregó ninguno."
              : "Ninguna fila del archivo se pudo guardar. Revisa la lista de problemas.",
        },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json(resultado, { headers: sinCache });
  } catch (error) {
    console.error("Fallo al importar cursos:", error instanceof Error ? error.message : error);

    return Response.json(
      { mensaje: "No se pudo procesar el archivo. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
