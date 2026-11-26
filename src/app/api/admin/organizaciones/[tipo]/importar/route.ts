import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import {
  leerSolicitudDeArchivo,
  respuestaDeProblema,
  sinCache,
} from "@/lib/importacion/solicitud-archivo";
import { columnasDe } from "@/lib/organizaciones/columnas-importacion";
import { crearServicioImportacionOrganizaciones } from "@/lib/organizaciones/crear-servicio-importacion-organizaciones";
import { ETIQUETA_TIPO, interpretarTipoOrganizacion } from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string }> };

/** Revisa o importa un archivo de asociaciones o de clubes. */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const tipo = interpretarTipoOrganizacion((await contexto.params).tipo);

    if (!tipo) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const lectura = await leerSolicitudDeArchivo(solicitud);
    if (!lectura.ok) return lectura.respuesta;

    try {
      const contenido = Buffer.from(await lectura.archivo.arrayBuffer());
      const servicio = crearServicioImportacionOrganizaciones();

      const resultado =
        lectura.accion === "importar"
          ? await servicio.importar(contenido, tipo)
          : await servicio.revisar(contenido, tipo);

      const problema = respuestaDeProblema(resultado, columnasDe(tipo));
      if (problema) return problema;

      if (resultado.tipo === "sin_filas_nuevas") {
        return Response.json(
          {
            ...resultado,
            mensaje:
              resultado.repetidas.length > 0 && resultado.fallidas === 0
                ? `Todas las ${ETIQUETA_TIPO[tipo].plural} del archivo ya estaban creadas, así que no se agregó ninguna.`
                : "Ninguna fila del archivo se pudo guardar. Revisa la lista de problemas.",
          },
          { status: 422, headers: sinCache }
        );
      }

      return Response.json(resultado, { headers: sinCache });
    } catch (error) {
      console.error(`Fallo al importar ${tipo}:`, error instanceof Error ? error.message : error);

      return Response.json(
        { mensaje: "No se pudo procesar el archivo. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
