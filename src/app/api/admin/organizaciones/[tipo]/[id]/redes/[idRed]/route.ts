import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { interpretarTipoOrganizacion } from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string; idRed: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Quita una red social de una asociación o de un club. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const { tipo: tipoCrudo, id: idCrudo, idRed } = await contexto.params;
    const tipo = interpretarTipoOrganizacion(tipoCrudo);
    const id = Number(idCrudo);
    const idRedSocial = Number(idRed);

    if (!tipo || !Number.isSafeInteger(id) || id <= 0) return noEncontrado();
    if (!Number.isSafeInteger(idRedSocial) || idRedSocial <= 0) return noEncontrado();

    try {
      const resultado = await crearServicioOrganizaciones().eliminarRedSocial(
        tipo,
        id,
        idRedSocial
      );

      if (resultado.tipo !== "eliminada") return noEncontrado();

      return Response.json({ eliminada: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo quitar el enlace. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
