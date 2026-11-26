import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { crearServicioTurnos } from "@/lib/prestamo-batas/crear-servicios-prestamo-batas";
import { erroresPorCampo } from "@/validators/errores";
import { esquemaTurno } from "@/validators/prestamo-batas";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Crea un turno de atención del salón. */
export const POST = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const cuerpo = await solicitud.json().catch(() => null);
  const validacion = esquemaTurno.safeParse(cuerpo);

  if (!validacion.success) {
    return Response.json(
      { errores: erroresPorCampo(validacion.error) },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const resultado = await crearServicioTurnos().crear(validacion.data);

    if (resultado.tipo === "invalido") {
      return Response.json({ errores: resultado.errores }, { status: 422, headers: sinCache });
    }

    return Response.json({ idTurno: resultado.idTurno }, { status: 201, headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudo guardar el turno. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
