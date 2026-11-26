import { protegerRuta } from "@/lib/auth/guardias";
import { notificar, TIPOS_NOTIFICACION } from "@/lib/notificaciones/notificaciones";
import { obtenerTutoriaParaAviso } from "@/lib/tutorias/consultas-tutorias";
import { crearServicioAgenda } from "@/lib/tutorias/crear-servicios-tutorias";
import { interpretarAccionTutoria } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Cancela una tutoría.
 *
 * La pueden cancelar los dos mientras siga en pie. Darla por impartida va por
 * otra ruta, con las pruebas que respaldan las horas beca del tutor. Una
 * tutoría ajena responde como no encontrada, para no revelar que existe.
 */
export const PATCH = protegerRuta([], async (usuario, solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  const cuerpo = (await solicitud.json().catch(() => null)) as { accion?: unknown } | null;
  const accion = interpretarAccionTutoria(cuerpo?.accion);

  if (!accion) {
    return Response.json(
      { mensaje: "Indica una acción válida para la tutoría." },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioAgenda().resolver(usuario.idUsuario, id);

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }
    if (resultado.tipo === "no_permitida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    // Se avisa a la otra parte, nunca a quien acaba de hacerlo.
    const aviso = await obtenerTutoriaParaAviso(id);
    if (aviso) {
      const destinatarios = [aviso.idUsuarioTutor, aviso.idUsuarioEstudiante].filter(
        (idDestino): idDestino is number => idDestino !== null && idDestino !== usuario.idUsuario
      );

      for (const idDestino of destinatarios) {
        await notificar({
          idUsuario: idDestino,
          tipo: TIPOS_NOTIFICACION.tutoria,
          titulo: "Se canceló una tutoría",
          mensaje: `La tutoría de ${aviso.curso} del ${aviso.cuando} ya no se realizará.`,
          urlDestino: "/perfil#mis-tutorias",
        });
      }
    }

    return Response.json({ estado: resultado.estado }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo actualizar la tutoría. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
