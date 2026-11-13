import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioFichaTutor } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaDisponibilidad } from "@/validators/tutoria";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Agrega una franja de disponibilidad al tutor de la sesión. */
export const POST = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaDisponibilidad.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioFichaTutor().agregarFranja(
      usuario.idUsuario,
      validacion.data
    );

    if (resultado.tipo === "no_es_tutor") {
      return Response.json(
        { mensaje: "Tu cuenta no es tutor en la plataforma." },
        { status: 403, headers: sinCache }
      );
    }
    if (resultado.tipo === "invalida") {
      return Response.json(
        { errores: { general: resultado.mensaje } },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json({ agregada: true }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo agregar la franja. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
