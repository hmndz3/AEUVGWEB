import { NextRequest, NextResponse } from "next/server";

import { crearServicioAutenticacion } from "@/lib/auth/crear-servicio-autenticacion";
import { origenPermitido, respuestaOrigenInvalido } from "@/lib/seguridad/origen";
import { HECHOS, recortarCorreo, registrarHecho } from "@/lib/seguridad/registro-seguridad";
import {
  direccionDelCliente,
  limitadorIniciosSesion,
  limitadorPorDireccion,
  respuestaDemasiadosIntentos,
} from "@/lib/seguridad/limitador";
import { MENSAJE_CREDENCIALES_INVALIDAS } from "@/lib/auth/mensajes-autenticacion";
import { crearTokenSesion, NOMBRE_COOKIE_SESION, opcionesCookieSesion } from "@/lib/auth/sesion";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";
import { crearEsquemaInicioSesion } from "@/validators/inicio-sesion";

export const runtime = "nodejs";

export async function POST(solicitud: NextRequest) {
  // Un inicio de sesión lanzado desde otra página serviría para dejar a alguien
  // dentro de una cuenta ajena sin que lo note.
  if (!origenPermitido(solicitud)) {
    registrarHecho(HECHOS.origenRechazado, { ruta: "/api/auth/iniciar-sesion" });
    return respuestaOrigenInvalido();
  }

  let cuerpo: unknown;

  try {
    cuerpo = await solicitud.json();
  } catch {
    return NextResponse.json({ mensaje: "Revisa los datos ingresados." }, { status: 400 });
  }

  try {
    const configuracionRegistro = obtenerConfiguracionRegistro();
    const validacion = crearEsquemaInicioSesion(
      configuracionRegistro.dominioInstitucional
    ).safeParse(cuerpo);

    if (!validacion.success) {
      return NextResponse.json({ mensaje: "Revisa los datos ingresados." }, { status: 400 });
    }

    // Dos topes: uno protege a la cuenta concreta y el otro corta a quien
    // prueba muchos correos distintos desde el mismo sitio.
    const direccion = direccionDelCliente(solicitud);
    const claveIntentos = `${direccion}:${validacion.data.correo}`;

    if (!limitadorIniciosSesion.permitir(claveIntentos)) {
      registrarHecho(HECHOS.limiteAlcanzado, {
        direccion,
        correo: recortarCorreo(validacion.data.correo),
        motivo: "intentos de una misma cuenta",
      });
      return respuestaDemasiadosIntentos(limitadorIniciosSesion.segundosDeEspera(claveIntentos));
    }
    if (!limitadorPorDireccion.permitir(direccion)) {
      registrarHecho(HECHOS.limiteAlcanzado, {
        direccion,
        motivo: "intentos desde una misma dirección",
      });
      return respuestaDemasiadosIntentos(limitadorPorDireccion.segundosDeEspera(direccion));
    }

    const configuracionSesion = obtenerConfiguracionSesion();
    const resultado = await crearServicioAutenticacion().iniciarSesion(validacion.data);

    if (resultado.tipo !== "autenticado") {
      limitadorIniciosSesion.registrar(claveIntentos);
      limitadorPorDireccion.registrar(direccion);
      registrarHecho(HECHOS.accesoFallido, {
        direccion,
        correo: recortarCorreo(validacion.data.correo),
      });
      return NextResponse.json(
        { mensaje: MENSAJE_CREDENCIALES_INVALIDAS },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    limitadorIniciosSesion.reiniciar(claveIntentos);
    limitadorPorDireccion.reiniciar(direccion);
    registrarHecho(HECHOS.accesoCorrecto, {
      direccion,
      idUsuario: resultado.usuario.idUsuario,
    });
    const token = await crearTokenSesion(
      { idUsuario: resultado.usuario.idUsuario },
      configuracionSesion
    );
    const respuesta = NextResponse.json(
      { mensaje: "Inicio de sesión correcto." },
      { headers: { "Cache-Control": "no-store" } }
    );
    respuesta.cookies.set({
      name: NOMBRE_COOKIE_SESION,
      value: token,
      ...opcionesCookieSesion(configuracionSesion),
    });
    return respuesta;
  } catch {
    return NextResponse.json(
      { mensaje: "El servicio de autenticación no está disponible temporalmente." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
