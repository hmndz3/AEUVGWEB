import { crearServicioRegistro } from "@/lib/auth/crear-servicio-registro";
import {
  direccionDelCliente,
  limitadorRegistro,
  respuestaDemasiadosIntentos,
} from "@/lib/seguridad/limitador";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { crearEsquemaRegistro } from "@/validators/registro";

export async function POST(solicitud: Request) {
  // Sin tope, una sola máquina puede llenar la base de cuentas a medio
  // verificar y disparar un correo por cada una.
  const direccion = direccionDelCliente(solicitud);
  if (!limitadorRegistro.permitir(direccion)) {
    return respuestaDemasiadosIntentos(limitadorRegistro.segundosDeEspera(direccion));
  }
  limitadorRegistro.registrar(direccion);

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
  } catch (error) {
    // Sin esto el motivo se perdía: una variable de correo ausente en Railway
    // solo se veía como "no disponible temporalmente".
    console.error(
      "Fallo en el registro de cuentas:",
      error instanceof Error ? error.message : error
    );
    return Response.json(
      { mensaje: "El servicio de registro no está disponible temporalmente." },
      { status: 503 }
    );
  }
}
