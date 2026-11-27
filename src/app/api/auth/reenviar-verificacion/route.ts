import { crearServicioRegistro } from "@/lib/auth/crear-servicio-registro";
import {
  direccionDelCliente,
  limitadorCorreos,
  respuestaDemasiadosIntentos,
} from "@/lib/seguridad/limitador";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaReenvio } from "@/validators/registro";

const respuestaUniforme = {
  mensaje:
    "Si existe una cuenta pendiente para ese correo, recibirás un nuevo enlace cuando el límite de seguridad lo permita.",
};

export async function POST(solicitud: Request) {
  // Mismo motivo que en la recuperación: este formulario manda correos a
  // petición de quien no ha iniciado sesión.
  const direccion = direccionDelCliente(solicitud);
  if (!limitadorCorreos.permitir(direccion)) {
    return respuestaDemasiadosIntentos(limitadorCorreos.segundosDeEspera(direccion));
  }
  limitadorCorreos.registrar(direccion);

  try {
    const cuerpo: unknown = await solicitud.json();
    const configuracion = obtenerConfiguracionRegistro();
    const validacion = crearEsquemaReenvio(configuracion.dominioInstitucional).safeParse(cuerpo);

    if (validacion.success) {
      await crearServicioRegistro().reenviar(validacion.data.correo);
    }

    // La respuesta es idéntica para correos ausentes, inválidos, verificados o limitados.
    return Response.json(respuestaUniforme, { status: 202 });
  } catch (error) {
    console.error(
      "Fallo al reenviar la verificación:",
      error instanceof Error ? error.message : error
    );
    return Response.json(respuestaUniforme, { status: 202 });
  }
}
