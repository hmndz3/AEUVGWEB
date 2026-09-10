import { crearServicioRegistro } from "@/lib/auth/crear-servicio-registro";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaReenvio } from "@/validators/registro";

const respuestaUniforme = {
  mensaje:
    "Si existe una cuenta pendiente para ese correo, recibirás un nuevo enlace cuando el límite de seguridad lo permita.",
};

export async function POST(solicitud: Request) {
  try {
    const cuerpo: unknown = await solicitud.json();
    const configuracion = obtenerConfiguracionRegistro();
    const validacion = crearEsquemaReenvio(configuracion.dominioInstitucional).safeParse(cuerpo);

    if (validacion.success) {
      await crearServicioRegistro().reenviar(validacion.data.correo);
    }

    // La respuesta es idéntica para correos ausentes, inválidos, verificados o limitados.
    return Response.json(respuestaUniforme, { status: 202 });
  } catch {
    return Response.json(respuestaUniforme, { status: 202 });
  }
}
