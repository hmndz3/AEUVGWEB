import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { erroresPorCampo } from "@/validators/errores";
import {
  esquemaIntegranteAdmin,
  interpretarTipoOrganizacion,
} from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/**
 * Registra un integrante de la junta directiva.
 *
 * Solo las asociaciones tienen junta: el requerimiento de AEUVG no contempla ese
 * dato para los clubes, así que la ruta de un club responde como inexistente en
 * lugar de aceptar datos que ninguna pantalla mostraría.
 */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const { tipo: tipoCrudo, id: idCrudo } = await contexto.params;
    const tipo = interpretarTipoOrganizacion(tipoCrudo);
    const idAsociacion = Number(idCrudo);

    if (tipo !== "asociaciones" || !Number.isSafeInteger(idAsociacion) || idAsociacion <= 0) {
      return noEncontrado();
    }

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaIntegranteAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOrganizaciones().guardarIntegrante(
        idAsociacion,
        validacion.data
      );

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }

      return Response.json({ id: resultado.id }, { status: 201, headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el integrante. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
