import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioVoluntarios } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPostulacionVoluntario } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Envía la postulación del estudiante de la sesión para ser voluntario del salón.
 *
 * El estudiante sale de la sesión, no del cuerpo, para que nadie postule a otra
 * persona. La protección es de sesión y no de rol: postularse es lo que hace
 * quien todavía no es voluntario.
 */
export const POST = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaPostulacionVoluntario.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioVoluntarios().postular(usuario.idUsuario, validacion.data);

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
