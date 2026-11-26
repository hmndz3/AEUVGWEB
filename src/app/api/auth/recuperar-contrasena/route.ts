import { crearServicioRecuperacion } from "@/lib/auth/crear-servicio-recuperacion";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaSolicitudRecuperacion } from "@/validators/recuperacion";

export const runtime = "nodejs";

const respuestaUniforme = {
  mensaje:
    "Si existe una cuenta activa con ese correo, recibirás un enlace para restablecer tu contraseña.",
};

export async function POST(solicitud: Request) {
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
