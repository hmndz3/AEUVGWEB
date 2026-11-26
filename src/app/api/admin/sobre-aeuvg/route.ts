import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaInformacionAeuvg } from "@/validators/organizacion-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Guarda la información institucional de la página Sobre AEUVG. La junta
 * directiva y las redes usan los endpoints de las asociaciones, con el
 * identificador de la ficha de AEUVG que devuelve esta ruta.
 */
export const PUT = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaInformacionAeuvg.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioOrganizaciones().guardarInformacionGeneral(
      validacion.data
    );

    if (resultado.tipo === "invalida") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ id: resultado.id }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar la información. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
