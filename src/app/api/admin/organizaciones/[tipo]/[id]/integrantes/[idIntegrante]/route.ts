import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { erroresPorCampo } from "@/validators/errores";
import {
  esquemaIntegranteAdmin,
  interpretarTipoOrganizacion,
} from "@/validators/organizacion-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ tipo: string; id: string; idIntegrante: string }> };

const sinCache = { "Cache-Control": "no-store" };

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Resuelve la asociación y el integrante de la dirección, o null si no son válidos. */
async function leerRuta(
  contexto: Contexto
): Promise<{ idAsociacion: number; idIntegrante: number } | null> {
  const { tipo, id, idIntegrante } = await contexto.params;
  const idAsociacion = Number(id);
  const integrante = Number(idIntegrante);

  if (interpretarTipoOrganizacion(tipo) !== "asociaciones") return null;
  if (!Number.isSafeInteger(idAsociacion) || idAsociacion <= 0) return null;
  if (!Number.isSafeInteger(integrante) || integrante <= 0) return null;

  return { idAsociacion, idIntegrante: integrante };
}

/** Edita un integrante de la junta directiva. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const ruta = await leerRuta(contexto);
    if (!ruta) return noEncontrado();

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
        ruta.idAsociacion,
        validacion.data,
        ruta.idIntegrante
      );

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }

      return Response.json({ id: resultado.id }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el integrante. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Quita un integrante de la junta directiva. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const ruta = await leerRuta(contexto);
    if (!ruta) return noEncontrado();

    try {
      const resultado = await crearServicioOrganizaciones().eliminarIntegrante(
        ruta.idAsociacion,
        ruta.idIntegrante
      );

      if (resultado.tipo !== "eliminada") return noEncontrado();

      return Response.json({ eliminada: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo quitar el integrante. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
