import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioPostulaciones } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPostulacionTutor } from "@/validators/tutoria";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Envía la postulación del estudiante de la sesión para ser tutor.
 *
 * El estudiante no viaja en el cuerpo: sale de la sesión, de modo que nadie
 * pueda postular a otra persona. La protección es de sesión y no de rol:
 * postularse es justamente lo que hace quien todavía no es tutor.
 */
export const POST = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaPostulacionTutor.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioPostulaciones().postular(
      usuario.idUsuario,
      validacion.data
    );

    if (resultado.tipo === "sin_estudiante") {
      return Response.json(
        { mensaje: "Tu cuenta no tiene una ficha de estudiante asociada." },
        { status: 409, headers: sinCache }
      );
    }
    if (resultado.tipo === "invalida") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    return Response.json(
      { idPostulacion: resultado.idPostulacion },
      { status: 201, headers: sinCache }
    );
  } catch {
    return Response.json(
      { mensaje: "No se pudo enviar la postulación. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
