import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioAgenda } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaSolicitudTutoria } from "@/validators/tutoria";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Solicita una tutoría al tutor y el horario elegidos.
 *
 * El estudiante sale de la sesión, y el lugar o el enlace salen de la franja
 * que el tutor publicó: ninguno de los dos viaja en el cuerpo, para que nadie
 * agende a nombre de otro ni cite al tutor donde nunca dijo que estaría.
 */
export const POST = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaSolicitudTutoria.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioAgenda().solicitar(usuario.idUsuario, validacion.data);

    if (resultado.tipo === "sin_estudiante") {
      return Response.json(
        { mensaje: "Tu cuenta no tiene una ficha de estudiante asociada." },
        { status: 409, headers: sinCache }
      );
    }
    if (resultado.tipo === "invalida") {
      return Response.json(
        { errores: { general: resultado.mensaje } },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json({ idTutoria: resultado.idTutoria }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo agendar la tutoría. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
