import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { interpretarTipoOrganizacion } from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string }> };

const sinCache = { "Cache-Control": "no-store" };

/**
 * Da de baja o reactiva una asociación o un club. Son las dos transiciones que
 * hace AEUVG: la eliminación definitiva vive en el mismo recurso sin "estado".
 */
export const PATCH = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const { tipo: tipoCrudo, id: idCrudo } = await contexto.params;
    const tipo = interpretarTipoOrganizacion(tipoCrudo);
    const id = Number(idCrudo);
    const cuerpo = (await solicitud.json().catch(() => null)) as { accion?: string } | null;

    if (!tipo || !Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    if (cuerpo?.accion !== "dar-de-baja" && cuerpo?.accion !== "reactivar") {
      return Response.json(
        { mensaje: "La acción debe ser dar-de-baja o reactivar." },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOrganizaciones().cambiarEstado(
        tipo,
        id,
        cuerpo.accion === "reactivar"
      );

      if (resultado.tipo === "no_encontrada") {
        return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
      }

      return Response.json({ activo: resultado.activo }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo cambiar el estado del registro. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
