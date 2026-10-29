import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOportunidades } from "@/lib/horas-beca/crear-servicio-oportunidades";
import { interpretarAccionOportunidad } from "@/validators/oportunidad-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Publica, cierra, cancela o finaliza una convocatoria.
 *
 * Vive en su propia ruta y no en el cuerpo de la edición: así corregir una
 * descripción no puede publicar sin querer lo que todavía era un borrador, que
 * es el error que más caro sale en esta pantalla.
 */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = Number((await contexto.params).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    const cuerpo = await solicitud.json().catch(() => null);
    const accion = interpretarAccionOportunidad(
      cuerpo && typeof cuerpo === "object" ? (cuerpo as { accion?: unknown }).accion : null
    );

    if (!accion) {
      return Response.json(
        { mensaje: "Indica una acción válida para la convocatoria." },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOportunidades().cambiarEstado(id, accion);

      if (resultado.tipo === "no_encontrada") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }
      if (resultado.tipo === "no_permitido") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
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
