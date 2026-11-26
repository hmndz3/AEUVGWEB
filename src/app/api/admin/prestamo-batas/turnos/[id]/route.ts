import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioTurnos } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaTurno } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Edita un turno de atención: su día, horario o si está activo. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaTurno.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioTurnos().editar(id, validacion.data);

      if (resultado.tipo === "invalido") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ idTurno: resultado.idTurno }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el turno. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Elimina un turno, salvo que tenga comprobantes de horas ya enviados. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioTurnos().eliminar(id);

      if (resultado.tipo === "con_dependencias") {
        return Response.json(
          {
            mensaje:
              "El turno tiene comprobantes de horas enviados. Desactívalo en lugar de eliminarlo.",
          },
          { status: 409, headers: sinCache }
        );
      }
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ eliminado: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar el turno. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
