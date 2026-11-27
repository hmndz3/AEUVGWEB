/**
 * Comprobación del origen en las peticiones que escriben.
 *
 * Es la segunda barrera contra la falsificación de peticiones entre sitios
 * (A01 del OWASP Top 10). La primera ya existe: la cookie de sesión va con
 * `SameSite=Lax`, así que el navegador no la manda en un envío que venga de
 * otra página. Esta comprobación cubre el caso de que esa política falle o
 * cambie, y además deja constancia explícita de la regla.
 *
 * Solo se mira en los métodos que cambian algo. Una lectura no necesita esta
 * barrera y exigirla rompería enlaces legítimos.
 */

const METODOS_QUE_ESCRIBEN = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * El anfitrión al que de verdad llegó la petición.
 *
 * Detrás del proxy de Railway el anfitrión público viaja en `x-forwarded-host`;
 * `host` es el del contenedor. Se prefiere el primero para poder comparar con
 * lo que el navegador escribió en la barra de direcciones.
 */
function anfitrionEsperado(solicitud: Request): string | null {
  const reenviado = solicitud.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  return reenviado || solicitud.headers.get("host") || null;
}

/**
 * True si la petición puede seguir.
 *
 * Sin cabecera `Origin` se deja pasar: la mandan los navegadores en todo envío
 * que cambia algo, así que su ausencia señala a un cliente que no arrastra la
 * cookie de nadie —una herramienta de línea de comandos, por ejemplo—, y ese
 * no es el ataque del que protege esta comprobación.
 */
export function origenPermitido(solicitud: Request): boolean {
  if (!METODOS_QUE_ESCRIBEN.has(solicitud.method.toUpperCase())) return true;

  const origen = solicitud.headers.get("origin");
  if (!origen) return true;

  const anfitrion = anfitrionEsperado(solicitud);
  if (!anfitrion) return false;

  try {
    return new URL(origen).host === anfitrion;
  } catch {
    // Un origen que ni siquiera es una dirección válida no viene de un
    // navegador hablando con este sitio.
    return false;
  }
}

/** Respuesta cuando el origen no cuadra. No explica más de lo necesario. */
export function respuestaOrigenInvalido(): Response {
  return Response.json(
    {
      mensaje: "La petición no se pudo verificar. Vuelve a cargar la página e inténtalo de nuevo.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}
