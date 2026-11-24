import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioNotificaciones } from "@/lib/notificaciones/repositorio-notificaciones";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** Marca como leída una notificación de la cuenta de la sesión. */
export const PATCH = protegerRuta([], async (usuario, _solicitud: Request, contexto: Contexto) => {
  const id = Number((await contexto.params).id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  try {
    const resultado = await crearServicioNotificaciones().marcarLeida(id, usuario.idUsuario);

    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ leida: true }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo marcar la notificación. Intenta de nuevo." },
      { status: 503, headers: sinCache }
    );
  }
});
