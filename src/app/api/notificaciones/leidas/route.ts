import { protegerRuta } from "@/lib/auth/guardias";
import { crearServicioNotificaciones } from "@/lib/notificaciones/repositorio-notificaciones";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Marca como leídas todas las notificaciones pendientes de la cuenta. */
export const POST = protegerRuta([], async (usuario) => {
  try {
    const marcadas = await crearServicioNotificaciones().marcarTodas(usuario.idUsuario);

    return Response.json({ marcadas }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudieron marcar las notificaciones. Intenta de nuevo." },
      { status: 503, headers: sinCache }
    );
  }
});
