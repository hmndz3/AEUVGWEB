import { NextRequest, NextResponse } from "next/server";

import { crearServicioAutenticacion } from "@/lib/auth/crear-servicio-autenticacion";
import { limitadorIniciosSesion } from "@/lib/auth/limitador-inicios-sesion";
import { MENSAJE_CREDENCIALES_INVALIDAS } from "@/lib/auth/mensajes-autenticacion";
import { crearTokenSesion, NOMBRE_COOKIE_SESION, opcionesCookieSesion } from "@/lib/auth/sesion";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";
import { crearEsquemaInicioSesion } from "@/validators/inicio-sesion";

export const runtime = "nodejs";

function obtenerDireccionCliente(solicitud: NextRequest): string {
  return (
    solicitud.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    solicitud.headers.get("x-real-ip") ??
    "desconocida"
  );
}

export async function POST(solicitud: NextRequest) {
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

    const claveIntentos = `${obtenerDireccionCliente(solicitud)}:${validacion.data.correo}`;
    if (!limitadorIniciosSesion.permitir(claveIntentos)) {
      return NextResponse.json(
        { mensaje: "Demasiados intentos. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } }
      );
    }

    const configuracionSesion = obtenerConfiguracionSesion();
    const resultado = await crearServicioAutenticacion().iniciarSesion(validacion.data);

    if (resultado.tipo !== "autenticado") {
      limitadorIniciosSesion.registrarFallo(claveIntentos);
      return NextResponse.json(
        { mensaje: MENSAJE_CREDENCIALES_INVALIDAS },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    limitadorIniciosSesion.reiniciar(claveIntentos);
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
