import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOportunidades } from "@/lib/horas-beca/crear-servicio-oportunidades";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaOportunidadAdmin } from "@/validators/oportunidad-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Corrige los datos de una convocatoria. El estado tiene su propia ruta. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaOportunidadAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOportunidades().editar(id, validacion.data);

      if (resultado.tipo === "invalida") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrada") return noEncontrado();

      return Response.json({ id: resultado.id }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar la convocatoria. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/**
 * Elimina una convocatoria que nunca llegó a usarse.
 *
 * Con horas registradas la operación se rechaza y el panel ofrece cancelarla:
 * esas horas son el historial de quien ya apoyó y no pueden quedarse sin origen.
 */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioOportunidades().eliminar(id);

      if (resultado.tipo === "no_encontrada") return noEncontrado();
      if (resultado.tipo === "no_permitida") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json({ eliminada: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar la convocatoria. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
