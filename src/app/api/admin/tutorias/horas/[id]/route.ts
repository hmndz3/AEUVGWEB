import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { notificar, TIPOS_NOTIFICACION } from "@/lib/notificaciones/notificaciones";
import { obtenerTutoriaParaAviso } from "@/lib/tutorias/consultas-tutorias";
import { crearServicioValidacionTutorias } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRevisionHorasTutoria } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * AEUVG acepta o rechaza las horas beca de una tutoría.
 *
 * Al aceptarlas se crea el registro del tutor, que queda pendiente de acreditar
 * como cualquier otro apoyo y aparece en su módulo de horas beca.
 */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (usuario, solicitud: Request, contexto: Contexto) => {
    const id = Number((await contexto.params).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = await solicitud.json().catch(() => null);
    const datos = esquemaRevisionHorasTutoria.safeParse(cuerpo);

    if (!datos.success) {
      return Response.json(
        { errores: erroresPorCampo(datos.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioValidacionTutorias().revisarHoras(
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

      if (aviso?.idUsuarioTutor) {
        await notificar({
          idUsuario: aviso.idUsuarioTutor,
          tipo: TIPOS_NOTIFICACION.horasBeca,
          titulo: acepto ? "Se aceptaron tus horas de tutoría" : "No se aceptaron tus horas",
          mensaje: acepto
            ? `Las horas de la tutoría de ${aviso.curso} del ${aviso.cuando} quedaron pendientes de acreditar.`
            : `AEUVG no aceptó las horas de la tutoría de ${aviso.curso} del ${aviso.cuando}.`,
          urlDestino: "/perfil#mis-horas-beca",
        });
      }

      return Response.json({ aceptadas: acepto }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo revisar las horas. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
