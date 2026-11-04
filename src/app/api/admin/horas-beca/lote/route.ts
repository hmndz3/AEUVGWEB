import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioLoteHoras } from "@/lib/horas-beca/crear-servicio-lote-horas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaLoteHoraAdmin } from "@/validators/hora-beca-admin";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Revisa o registra las mismas horas para varios carnets.
 *
 * La revisión resuelve la lista pegada contra las cuentas y no escribe nada:
 * es la que permite ver a quién se le van a registrar las horas antes de que
 * pase, igual que la revisión previa de la importación.
 */
export const POST = protegerRuta([ROLES.administrador], async (usuario, solicitud: Request) => {
  const cuerpo = (await solicitud.json().catch(() => null)) as Record<string, unknown> | null;
  const accion = cuerpo?.accion === "registrar" ? "registrar" : "revisar";
  const servicio = crearServicioLoteHoras();

  try {
    if (accion === "revisar") {
      const texto = typeof cuerpo?.carnets === "string" ? cuerpo.carnets : "";

      return Response.json(await servicio.revisar(texto), { headers: sinCache });
    }

    const validacion = esquemaLoteHoraAdmin.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { errores: erroresPorCampo(validacion.error) },
        { status: 422, headers: sinCache }
      );
    }

    const { carnets, ...datos } = validacion.data;
    const resultado = await servicio.registrar(carnets, datos, usuario.idUsuario);

    if (resultado.tipo === "invalido") {
      return Response.json(
        { errores: { carnets: resultado.mensaje } },
        { status: 422, headers: sinCache }
      );
    }

    return Response.json(
      { creados: resultado.creados, carnets: resultado.carnets },
      { status: 201, headers: sinCache }
    );
  } catch {
    return Response.json(
      { mensaje: "No se pudieron registrar las horas. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
