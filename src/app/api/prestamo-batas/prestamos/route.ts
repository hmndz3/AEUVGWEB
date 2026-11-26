import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioOperacion } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaPrestamo } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Registra un préstamo de batas o lentes. Solo lo hace un voluntario, durante su
 * atención del salón; el servicio descuenta del inventario y rechaza prestar más
 * de lo disponible.
 */
export const POST = protegerRuta([ROLES.voluntario], async (usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaPrestamo.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioOperacion().registrarPrestamo(
      validacion.data,
      usuario.idUsuario
    );

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    return Response.json({ idPrestamo: resultado.idPrestamo }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo registrar el préstamo. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
