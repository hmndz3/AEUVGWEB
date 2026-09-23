import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioEventos } from "@/lib/eventos/crear-servicio-eventos";
import { erroresPorCampo, esquemaEventoAdmin } from "@/validators/evento-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Crea un evento. Queda en borrador hasta que se publique explícitamente. */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaEventoAdmin.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioEventos().crear(validacion.data, usuario.idUsuario);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    if (resultado.tipo === "no_encontrado") {
      return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
    }

    return Response.json({ idEvento: resultado.idEvento }, { status: 201, headers: sinCache });
  } catch {
    // Sin este manejo, un fallo de la base respondía con un error genérico del
    // framework y en el formulario parecía que el botón no hacía nada.
    return Response.json(
      {
        mensaje:
          "No se pudo guardar el evento. Revisa que la base de datos esté disponible y con las migraciones aplicadas.",
      },
      { status: 503, headers: sinCache }
    );
  }
});
