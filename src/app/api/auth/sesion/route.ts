import { NextRequest, NextResponse } from "next/server";

import { crearServicioAutenticacion } from "@/lib/auth/crear-servicio-autenticacion";
import { NOMBRE_COOKIE_SESION, opcionesCookieSesion } from "@/lib/auth/sesion";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";

export const runtime = "nodejs";

export async function GET(solicitud: NextRequest) {
  try {
    const usuario = await crearServicioAutenticacion().obtenerUsuarioSesion(
      solicitud.cookies.get(NOMBRE_COOKIE_SESION)?.value
    );

    if (!usuario) {
      return NextResponse.json(
        { mensaje: "No autorizado." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        usuario: {
          idUsuario: usuario.idUsuario,
          nombreCompleto: usuario.nombreCompleto,
          correo: usuario.correo,
          roles: usuario.roles,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { mensaje: "No autorizado." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/** Cierra la sesión borrando la cookie. Es idempotente: sin sesión también responde 204. */
export async function DELETE() {
  const respuesta = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

  respuesta.cookies.set({
    ...opcionesCookieSesion(obtenerConfiguracionSesion()),
    name: NOMBRE_COOKIE_SESION,
    value: "",
    maxAge: 0,
  });

  return respuesta;
}
