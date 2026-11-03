import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOportunidades } from "@/lib/horas-beca/crear-servicio-oportunidades";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaOportunidadAdmin } from "@/validators/oportunidad-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Crea una convocatoria para realizar horas beca.
 *
 * Nace como borrador y queda a nombre del administrador de la sesión: el cuerpo
 * no puede indicar quién la creó ni en qué estado nace.
 */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaOportunidadAdmin.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioOportunidades().crear(validacion.data, usuario.idUsuario);

    if (resultado.tipo === "invalida") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrada") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ id: resultado.id }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      {
        mensaje:
          "No se pudo guardar la convocatoria. Revisa que la base de datos esté disponible y con las migraciones aplicadas.",
      },
      { status: 503, headers: sinCache }
    );
  }
});
