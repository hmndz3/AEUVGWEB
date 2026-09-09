import { crearServicioRegistro } from "@/lib/auth/crear-servicio-registro";
import { esquemaVerificacionCorreo } from "@/validators/registro";

export async function POST(solicitud: Request) {
  try {
    const cuerpo: unknown = await solicitud.json();
    const validacion = esquemaVerificacionCorreo.safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        { mensaje: "El enlace de verificación no es válido o ya venció." },
        { status: 400 }
      );
    }

    const verificado = await crearServicioRegistro().verificar(validacion.data.token);

    if (!verificado) {
      return Response.json(
        { mensaje: "El enlace de verificación no es válido o ya venció." },
        { status: 400 }
      );
    }

    return Response.json({ mensaje: "Tu cuenta fue verificada correctamente." });
  } catch {
    return Response.json(
      { mensaje: "No fue posible verificar la cuenta en este momento." },
      { status: 503 }
    );
  }
}
