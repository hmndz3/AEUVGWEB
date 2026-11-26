import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioComprobantes } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRevisionComprobante } from "@/validators/prestamo-batas";

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
 * Revisa un comprobante de entrada y salida. Al aprobarlo se crea un registro de
 * horas beca pendiente de acreditar, por la duración del turno.
 */
export const POST = protegerRuta(
  [ROLES.administrador],
  async (usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaRevisionComprobante.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const { decision, comentarioRevision } = validacion.data;
      const resultado = await crearServicioComprobantes().revisar(
        id,
        decision,
        comentarioRevision,
        usuario.idUsuario
      );

      if (resultado.tipo === "no_encontrado") return noEncontrado();
      if (resultado.tipo === "no_permitido") {
        return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
      }

      return Response.json(
        { estado: resultado.estado, horasAcreditadas: resultado.horasAcreditadas },
        { headers: sinCache }
      );
    } catch {
      return Response.json(
        { mensaje: "No se pudo revisar el comprobante. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
