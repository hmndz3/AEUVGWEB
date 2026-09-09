import { crearServicioRecuperacion } from "@/lib/auth/crear-servicio-recuperacion";
import { esquemaRestablecerContrasena } from "@/validators/recuperacion";

export const runtime = "nodejs";

const mensajeEnlaceInvalido =
  "El enlace no es válido o ya venció. Solicita uno nuevo para continuar.";

export async function POST(solicitud: Request) {
  let cuerpo: unknown;

  try {
    cuerpo = await solicitud.json();
  } catch {
    return Response.json({ mensaje: mensajeEnlaceInvalido }, { status: 400 });
  }

  const validacion = esquemaRestablecerContrasena.safeParse(cuerpo);

  if (!validacion.success) {
    const errores = validacion.error.issues.map((problema) => ({
      campo: problema.path.join("."),
      mensaje: problema.message,
    }));

    return Response.json({ mensaje: "Revisa los datos ingresados.", errores }, { status: 400 });
  }

  try {
    const resultado = await crearServicioRecuperacion().restablecer(
      validacion.data.token,
      validacion.data.contrasena
    );

    if (resultado.tipo === "token_invalido") {
      return Response.json({ mensaje: mensajeEnlaceInvalido }, { status: 400 });
    }

    return Response.json({
      mensaje: "Tu contraseña se actualizó. Ya puedes iniciar sesión.",
    });
  } catch {
    return Response.json(
      { mensaje: "No se pudo completar la operación. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
