import { crearServicioRecuperacion } from "@/lib/auth/crear-servicio-recuperacion";
import { origenPermitido, respuestaOrigenInvalido } from "@/lib/seguridad/origen";
import {
  direccionDelCliente,
  limitadorCorreos,
  respuestaDemasiadosIntentos,
} from "@/lib/seguridad/limitador";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaSolicitudRecuperacion } from "@/validators/recuperacion";

export const runtime = "nodejs";

const respuestaUniforme = {
  mensaje:
    "Si existe una cuenta activa con ese correo, recibirás un enlace para restablecer tu contraseña.",
};

export async function POST(solicitud: Request) {
  if (!origenPermitido(solicitud)) return respuestaOrigenInvalido();

  // El tope va por dirección y no por correo: así la respuesta sigue sin
  // revelar qué cuentas existen, y nadie puede usar este formulario para
  // llenarle el buzón a otra persona.
  const direccion = direccionDelCliente(solicitud);
  if (!limitadorCorreos.permitir(direccion)) {
    return respuestaDemasiadosIntentos(limitadorCorreos.segundosDeEspera(direccion));
  }
  limitadorCorreos.registrar(direccion);

  try {
    const cuerpo: unknown = await solicitud.json();
    const configuracion = obtenerConfiguracionRegistro();
    const validacion = crearEsquemaSolicitudRecuperacion(
      configuracion.dominioInstitucional
    ).safeParse(cuerpo);

    if (validacion.success) {
      await crearServicioRecuperacion().solicitar(validacion.data.correo);
    }

    // La respuesta no distingue entre correos inexistentes, inválidos o limitados.
    return Response.json(respuestaUniforme, { status: 202 });
  } catch (error) {
    console.error(
      "Fallo al solicitar la recuperación de contraseña:",
      error instanceof Error ? error.message : error
    );
    return Response.json(respuestaUniforme, { status: 202 });
  }
}
