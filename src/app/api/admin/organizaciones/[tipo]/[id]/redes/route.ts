import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { erroresPorCampo } from "@/validators/errores";
import {
  esquemaRedSocialAdmin,
  interpretarTipoOrganizacion,
} from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/**
 * Agrega una red social a una asociación o a un club. Los enlaces no se editan:
 * son un par de plataforma y dirección, y corregirlo equivale a quitarlo y
 * volverlo a agregar, que es también como lo presenta el panel.
 */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const { tipo: tipoCrudo, id: idCrudo } = await contexto.params;
    const tipo = interpretarTipoOrganizacion(tipoCrudo);
    const id = Number(idCrudo);

    if (!tipo || !Number.isSafeInteger(id) || id <= 0) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaRedSocialAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOrganizaciones().agregarRedSocial(
        tipo,
        id,
        validacion.data
      );

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }

      return Response.json({ id: resultado.id }, { status: 201, headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el enlace. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
