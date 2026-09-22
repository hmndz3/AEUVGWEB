import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioEventos } from "@/lib/eventos/crear-servicio-eventos";
import { erroresPorCampo, esquemaEventoAdmin } from "@/validators/evento-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function identificador(contexto: Contexto): Promise<number | null> {
  const { id } = await contexto.params;
  const numero = Number(id);

  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "El evento no existe." }, { status: 404, headers: sinCache });

/** Edita un evento existente. No cambia su estado de publicación. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const idEvento = await identificador(contexto);
    if (idEvento === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaEventoAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    const resultado = await crearServicioEventos().editar(idEvento, validacion.data);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrado") return noEncontrado();

    return Response.json({ idEvento: resultado.idEvento }, { headers: sinCache });
  }
);

/** Elimina un evento de forma permanente. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const idEvento = await identificador(contexto);
    if (idEvento === null) return noEncontrado();

    const resultado = await crearServicioEventos().eliminar(idEvento);

    if (resultado.tipo === "no_encontrado") return noEncontrado();
    if (resultado.tipo === "no_permitida") {
      // 409: la petición es válida, pero contradice el estado actual del evento.
      return Response.json({ mensaje: resultado.mensaje }, { status: 409, headers: sinCache });
    }

    return new Response(null, { status: 204, headers: sinCache });
  }
);
