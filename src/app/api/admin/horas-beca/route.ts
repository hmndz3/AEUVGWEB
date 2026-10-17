import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioHorasBeca } from "@/lib/horas-beca/crear-servicio-horas-beca";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaRegistroHoraAdmin } from "@/validators/hora-beca-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

const MENSAJE_BASE =
  "No se pudo guardar el registro. Revisa que la base de datos esté disponible y con las migraciones aplicadas.";

/**
 * Registra las horas beca de un estudiante.
 *
 * El registro queda a nombre del administrador de la sesión, que es quien
 * responde por él: el cuerpo no puede indicar quién lo creó.
 */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaRegistroHoraAdmin.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioHorasBeca().crear(validacion.data, usuario.idUsuario);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }
    if (resultado.tipo === "no_encontrado") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json(
      { id: resultado.id, vinculado: resultado.vinculado },
      { status: 201, headers: sinCache }
    );
  } catch {
    return Response.json({ mensaje: MENSAJE_BASE }, { status: 503, headers: sinCache });
  }
});
