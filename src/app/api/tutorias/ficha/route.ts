import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioFichaTutor } from "@/lib/tutorias/crear-servicios-tutorias";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaFichaTutor } from "@/validators/tutoria";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

const noEsTutor = () =>
  Response.json(
    { mensaje: "Tu cuenta no es tutor en la plataforma." },
    { status: 403, headers: sinCache }
  );

/**
 * Guarda la ficha pública del tutor de la sesión.
 *
 * El tutor sale de la sesión y no del cuerpo: la ficha es de quien la edita, y
 * recibir el identificador por parámetro permitiría editar la de cualquiera.
 */
export const PUT = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaFichaTutor.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioFichaTutor().guardarFicha(
      usuario.idUsuario,
      validacion.data
    );

    if (resultado.tipo === "no_es_tutor") return noEsTutor();
    if (resultado.tipo === "invalida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 422, headers: sinCache });
    }

    return Response.json({ guardada: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar la ficha. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
