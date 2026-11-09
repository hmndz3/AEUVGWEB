import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { ESTADOS_TUTOR } from "@/lib/tutorias/formato-tutorias";
import { crearServicioTutores } from "@/lib/tutorias/crear-servicios-tutorias";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/** Activa, desactiva o suspende a un tutor del directorio. */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = Number((await contexto.params).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = (await solicitud.json().catch(() => null)) as { estado?: unknown } | null;
    const estado = ESTADOS_TUTOR.find((valor) => valor === cuerpo?.estado);

    if (!estado) {
      return Response.json(
        { mensaje: "Indica un estado válido para el tutor." },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioTutores().cambiarEstado(id, estado);

      if (resultado.tipo === "no_encontrado") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }

      return Response.json({ estado: resultado.estado }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo cambiar el estado. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
