import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioEventos } from "@/lib/eventos/crear-servicio-eventos";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** Publica o cancela un evento. Son las dos transiciones que hace AEUVG. */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const { id } = await contexto.params;
    const idEvento = Number(id);
    const cuerpo = (await solicitud.json().catch(() => null)) as { accion?: string } | null;

    if (!Number.isSafeInteger(idEvento) || idEvento <= 0) {
      return Response.json({ mensaje: "El evento no existe." }, { status: 404, headers: sinCache });
    }

    if (cuerpo?.accion !== "publicar" && cuerpo?.accion !== "cancelar") {
      return Response.json(
        { mensaje: "La acción debe ser publicar o cancelar." },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const servicio = crearServicioEventos();
      const resultado =
        cuerpo.accion === "publicar"
          ? await servicio.publicar(idEvento)
          : await servicio.cancelar(idEvento);

      if (resultado.tipo === "no_encontrado") {
        return Response.json(
          { mensaje: "El evento no existe." },
          { status: 404, headers: sinCache }
        );
      }
      if (resultado.tipo === "no_permitida") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json({ estado: resultado.estado }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo cambiar el estado del evento. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
