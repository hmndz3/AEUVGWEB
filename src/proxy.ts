import { NextResponse, type NextRequest } from "next/server";

import { NOMBRE_COOKIE_SESION, validarTokenSesion } from "@/lib/auth/sesion";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";
import { generarNonce, politicaDeContenidos } from "@/lib/seguridad/cabeceras";

/**
 * Lo que corre antes de pintar cualquier página.
 *
 * Hace dos cosas: pone la política de contenidos con su número de un solo uso
 * —que tiene que cambiar en cada respuesta, por eso no puede declararse en la
 * configuración— y evita mostrar pantallas privadas a quien no inició sesión.
 *
 * El control de acceso de verdad no está aquí: esto solo comprueba que la
 * cookie tenga una firma válida y vigente. Los roles se verifican en el
 * servidor contra la base, en src/lib/auth/guardias.ts, porque este archivo
 * corre en un runtime aparte y no debe ser la única barrera.
 *
 * Se llama proxy y no middleware porque el marco renombró el archivo; el
 * nombre viejo quedó marcado como obsoleto.
 */

/** Rutas que exigen sesión. */
const RUTAS_PRIVADAS = ["/admin", "/perfil"];

/** Rutas de acceso que no tiene sentido ver con la sesión ya iniciada. */
const RUTAS_DE_ACCESO = ["/iniciar-sesion", "/crear-cuenta"];

export async function proxy(solicitud: NextRequest) {
  const ruta = solicitud.nextUrl.pathname;
  const nonce = generarNonce();
  const politica = politicaDeContenidos(nonce, process.env.NODE_ENV === "production");

  const esPrivada = RUTAS_PRIVADAS.some(
    (privada) => ruta === privada || ruta.startsWith(`${privada}/`)
  );
  const esDeAcceso = RUTAS_DE_ACCESO.includes(ruta);

  if (esPrivada || esDeAcceso) {
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
  }

  // El número viaja también en la petición para que la página pueda marcar con
  // él el guion que escribe en línea (ver src/app/layout.tsx).
  const cabeceras = new Headers(solicitud.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", politica);

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", politica);

  return respuesta;
}

export const config = {
  matcher: [
    // Todas las páginas menos los archivos que no ejecutan nada. Las rutas de
    // API quedan fuera a propósito: no pintan HTML, así que la política no les
    // aporta, y sus cabeceras fijas salen de next.config.ts.
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
