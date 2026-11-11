import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioAgenda } from "@/lib/tutorias/crear-servicios-tutorias";
import { interpretarAccionTutoria } from "@/validators/tutoria";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Cancela una tutoría o la da por completada.
 *
 * Quién puede hacer qué lo decide el servicio a partir de la sesión: cancelar
 * lo pueden los dos y completar solo el tutor. Una tutoría ajena responde como
 * no encontrada, para no revelar que existe.
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
    const resultado = await crearServicioAgenda().resolver(usuario.idUsuario, id, accion);

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }
    if (resultado.tipo === "no_permitida") {
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    return Response.json({ estado: resultado.estado }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo actualizar la tutoría. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
