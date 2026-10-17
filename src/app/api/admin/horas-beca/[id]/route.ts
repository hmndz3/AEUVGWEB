import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioHorasBeca } from "@/lib/horas-beca/crear-servicio-horas-beca";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRegistroHoraAdmin } from "@/validators/hora-beca-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/**
 * Corrige un registro de horas.
 *
 * El estado, la fecha de acreditación y el administrador que la aplicó no viajan
 * en el cuerpo: pertenecen a la acreditación, que tiene su propia ruta. Así
 * corregir una descripción no puede devolver a pendiente lo ya acreditado.
 */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaRegistroHoraAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioHorasBeca().editar(id, validacion.data);

      if (resultado.tipo === "invalido") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json(
        { id: resultado.id, vinculado: resultado.vinculado },
        { headers: sinCache }
      );
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el registro. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Elimina un registro de horas de forma definitiva. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioHorasBeca().eliminar(id);

      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ eliminado: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar el registro. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
