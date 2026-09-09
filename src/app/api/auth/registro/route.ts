import { crearServicioRegistro } from "@/lib/auth/crear-servicio-registro";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaRegistro } from "@/validators/registro";

export async function POST(solicitud: Request) {
  try {
    const cuerpo: unknown = await solicitud.json();
    const configuracion = obtenerConfiguracionRegistro();
    const validacion = crearEsquemaRegistro(configuracion.dominioInstitucional).safeParse(cuerpo);

    if (!validacion.success) {
      return Response.json(
        {
          mensaje: "Revisa los datos ingresados.",
          errores: validacion.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const servicio = crearServicioRegistro();
    const resultado = await servicio.registrar(validacion.data);

    if (resultado.tipo === "duplicada") {
      // Si corresponde a una cuenta pendiente real, el titular puede recibir un
      // enlace nuevo; la respuesta no permite distinguir ese caso desde fuera.
      await servicio.reenviar(validacion.data.correo);
      return Response.json(
        {
          mensaje:
            "Si los datos son elegibles, recibirás instrucciones en tu correo institucional.",
        },
        { status: 202 }
      );
    }

    if (resultado.tipo === "catalogo_invalido") {
      return Response.json(
        { mensaje: "La facultad o carrera seleccionada no es válida." },
        { status: 422 }
      );
    }

    return Response.json(
      {
        mensaje: "Si los datos son elegibles, recibirás instrucciones en tu correo institucional.",
      },
      { status: 202 }
    );
  } catch {
    return Response.json(
      { mensaje: "El servicio de registro no está disponible temporalmente." },
      { status: 503 }
    );
  }
}
