import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOperacion } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaDevolucion } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const sinCache = { "Cache-Control": "no-store" };

async function leerId(contexto: Contexto): Promise<number | null> {
  const id = Number((await contexto.params).id);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const noEncontrado = () =>
  Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });

/** Marca un préstamo como devuelto, con lo que el artículo vuelve al inventario. */
export const PATCH = protegerRuta(
  [ROLES.voluntario],
  async (_usuario, solicitud: Request, contexto: Contexto) => {
    const id = await leerId(contexto);
    if (id === null) return noEncontrado();

    const cuerpo = await solicitud.json().catch(() => ({}));
    const validacion = esquemaDevolucion.safeParse(cuerpo ?? {});

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    try {
      const resultado = await crearServicioOperacion().devolver(id, validacion.data);
      if (resultado.tipo !== "devuelto") return noEncontrado();

      return Response.json({ devuelto: true }, { headers: sinCache });
    } catch {
      return Response.json(
        { mensaje: "No se pudo registrar la devolución. Intenta de nuevo en unos minutos." },
        { status: 503, headers: sinCache }
      );
    }
  }
);
