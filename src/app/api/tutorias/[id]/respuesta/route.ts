import { protegerRuta } from "@/lib/auth/guardias";
import { notificar, TIPOS_NOTIFICACION } from "@/lib/notificaciones/notificaciones";
import { obtenerTutoriaParaAviso } from "@/lib/tutorias/consultas-tutorias";
import { crearServicioValidacionTutorias } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRespuestaTutoria } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * El tutor acepta o rechaza la tutoría que le agendaron.
 *
 * Quién puede hacerlo lo decide el servicio a partir de la sesión: una tutoría
 * que no es suya responde como no encontrada, para no revelar que existe.
 */
export const POST = protegerRuta([], async (usuario, solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  const cuerpo = await solicitud.json().catch(() => null);
  const datos = esquemaRespuestaTutoria.safeParse(cuerpo);

  if (!datos.success) {
    return Response.json(
      { errores: erroresPorCampo(datos.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioValidacionTutorias().responder(
      usuario.idUsuario,
      id,
      datos.data.decision,
      datos.data.comentario
    );

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }
    if (resultado.tipo === "no_permitida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    const aviso = await obtenerTutoriaParaAviso(id);
    const acepto = datos.data.decision === "aceptar";

    if (aviso?.idUsuarioEstudiante) {
      await notificar({
        idUsuario: aviso.idUsuarioEstudiante,
        tipo: TIPOS_NOTIFICACION.tutoria,
        titulo: acepto ? "Tu tutoría fue aceptada" : "Tu tutoría fue rechazada",
        mensaje: acepto
          ? `El tutor aceptó la tutoría de ${aviso.curso} del ${aviso.cuando}.`
          : `El tutor no puede dar la tutoría de ${aviso.curso} del ${aviso.cuando}. Puedes agendar otra.`,
        urlDestino: "/perfil#mis-tutorias",
      });
    }

    return Response.json({ estado: acepto ? "ACEPTADA" : "RECHAZADA" }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo responder la tutoría. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
