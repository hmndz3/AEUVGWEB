import { NextResponse, type NextRequest } from "next/server";

import { NOMBRE_COOKIE_SESION, validarTokenSesion } from "@/lib/auth/sesion";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";

/**
 * Rutas que exigen sesión. El middleware solo comprueba que la cookie tenga una
 * firma válida y vigente: evita mostrar pantallas privadas a quien no inició
 * sesión, pero no sustituye a la comprobación de roles, que se hace en el
 * servidor con los datos de la base (ver src/lib/auth/guardias.ts).
 */
const RUTAS_PRIVADAS = ["/admin"];

/** Rutas de acceso que no tiene sentido ver con la sesión ya iniciada. */
const RUTAS_DE_ACCESO = ["/iniciar-sesion", "/crear-cuenta"];

export async function middleware(solicitud: NextRequest) {
  const ruta = solicitud.nextUrl.pathname;
  const esPrivada = RUTAS_PRIVADAS.some(
    (privada) => ruta === privada || ruta.startsWith(`${privada}/`)
  );
  const esDeAcceso = RUTAS_DE_ACCESO.includes(ruta);

  if (!esPrivada && !esDeAcceso) return NextResponse.next();

  const token = solicitud.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  let sesionValida = false;

  try {
    sesionValida = (await validarTokenSesion(token, obtenerConfiguracionSesion())) !== null;
  } catch {
    // Sin configuración de sesión no se puede validar; se trata como anónimo.
    sesionValida = false;
  }

  if (esPrivada && !sesionValida) {
    const destino = new URL("/iniciar-sesion", solicitud.url);
    destino.searchParams.set("continuar", ruta);
    return NextResponse.redirect(destino);
  }

  if (esDeAcceso && sesionValida) {
    return NextResponse.redirect(new URL("/", solicitud.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/iniciar-sesion", "/crear-cuenta"],
};
