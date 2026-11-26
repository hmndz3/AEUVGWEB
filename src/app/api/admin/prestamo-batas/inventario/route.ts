import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioInventario } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaArticuloInventario } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Agrega un artículo al inventario de batas y lentes. */
export const POST = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaArticuloInventario.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioInventario().crear(validacion.data);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    return Response.json({ idArticulo: resultado.idArticulo }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar el artículo. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
