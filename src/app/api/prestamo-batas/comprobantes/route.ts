import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioComprobantes } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaComprobanteTurno } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Envía el comprobante de entrada y salida de un turno. Solo lo hace el
 * voluntario asignado a ese turno; con él AEUVG le acredita las horas beca.
 */
export const POST = protegerRuta([ROLES.voluntario], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaComprobanteTurno.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioComprobantes().enviar(usuario.idUsuario, validacion.data);

    if (resultado.tipo === "sin_estudiante") {
      return Response.json(
        { mensaje: "Tu cuenta no tiene una ficha de estudiante asociada." },
        { status: 409, headers: sinCache }
      );
    }
    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    return Response.json(
      { idComprobante: resultado.idComprobante },
      { status: 201, headers: sinCache }
    );
  } catch {
    return Response.json(
      { mensaje: "No se pudo enviar el comprobante. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
