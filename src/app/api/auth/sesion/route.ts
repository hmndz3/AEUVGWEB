import { NextRequest, NextResponse } from "next/server";

import { crearServicioAutenticacion } from "@/lib/auth/crear-servicio-autenticacion";
import { NOMBRE_COOKIE_SESION } from "@/lib/auth/sesion";

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
