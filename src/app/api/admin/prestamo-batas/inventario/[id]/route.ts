import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioInventario } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaArticuloInventario } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Edita un artículo del inventario: su tipo, talla, cantidad o si está activo. */
export const PUT = protegerRuta(
  [ROLES.administrador],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => null);
    const validacion = esquemaArticuloInventario.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioInventario().editar(id, validacion.data);

      if (resultado.tipo === "invalido") {
        return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
      }
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ idArticulo: resultado.idArticulo }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo guardar el artículo. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);

/** Elimina un artículo del inventario, salvo que tenga préstamos registrados. */
export const DELETE = protegerRuta(
  [ROLES.administrador],
  async (_usuario, _solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    try {
      const resultado = await crearServicioInventario().eliminar(id);

      if (resultado.tipo === "con_prestamos") {
        return Response.json(
          {
            mensaje: "El artículo tiene préstamos registrados. Desactívalo en lugar de eliminarlo.",
          },
          { status: 409, headers: sinCache }
        );
      }
      if (resultado.tipo === "no_encontrado") return noEncontrado();

      return Response.json({ eliminado: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo eliminar el artículo. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
