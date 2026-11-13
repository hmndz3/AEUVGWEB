import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioPostulaciones } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRevisionPostulacion } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Aprueba o rechaza una postulación para ser tutor.
 *
 * Aprobar no solo cambia el estado: da de alta al tutor con los cursos que
 * respaldó y le concede el rol, todo en una transacción. Por eso es una
 * operación con su propia ruta y no un campo editable de la postulación.
 */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (usuario, solicitud: Request, contexto: Contexto) => {
    const id = Number((await contexto.params).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaRevisionPostulacion.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioPostulaciones().revisar(
        id,
        validacion.data.decision,
        validacion.data.comentarioRevision,
        usuario.idUsuario
      );

      if (resultado.tipo === "no_encontrada") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }
      if (resultado.tipo === "no_permitida") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json(
        { estado: resultado.estado, idTutor: resultado.idTutor },
        { headers: sinCache }
      );
    } catch {
      return Response.json(
        { mensaje: "No se pudo resolver la postulación. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
