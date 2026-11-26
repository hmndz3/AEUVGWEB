import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOperacion } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaListaNegra } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Agrega a alguien a la lista negra del salón. Solo lo hace un voluntario. */
export const POST = protegerRuta([ROLES.voluntario], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaListaNegra.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioOperacion().agregarListaNegra(
      validacion.data,
      usuario.idUsuario
    );

    return Response.json(
      { idListaNegra: resultado.idListaNegra },
      { status: 201, headers: sinCache }
    );
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar la entrada. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
