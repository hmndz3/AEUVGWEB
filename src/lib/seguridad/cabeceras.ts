/**
 * Cabeceras de seguridad de la plataforma.
 *
 * Son la respuesta a dos puntos del OWASP Top 10: A05 (configuración
 * insegura), porque un sitio sin estas cabeceras deja al navegador adivinar
 * qué puede ejecutar, y A03 (inyección), porque la política de contenidos es
 * la última barrera si alguna vez se colara una etiqueta en una página.
 *
 * Las que no dependen de la petición se declaran en next.config.ts, de modo
 * que también cubran las rutas de API y los archivos estáticos. La política de
 * contenidos se arma aquí porque lleva un valor distinto en cada respuesta: el
 * número de un solo uso que autoriza los guiones que la propia página escribe.
 */

/** Dominios de los que se admiten imágenes además del propio sitio. */
const IMAGENES_EXTERNAS = ["https://res.cloudinary.com"];

export type CabeceraSegura = { key: string; value: string };

/**
 * Cabeceras fijas, iguales en toda respuesta.
 *
 * - `X-Content-Type-Options` impide que el navegador adivine el tipo de un
 *   archivo: sin ella, una imagen con contenido de otra cosa podría acabar
 *   ejecutándose.
 * - `X-Frame-Options` y `frame-ancestors` evitan que el sitio se incruste en
 *   otra página para engañar a quien pulsa (clickjacking).
 * - `Referrer-Policy` deja de mandar la dirección completa a otros sitios, que
 *   en una página privada revelaría a dónde entró la persona.
 * - `Permissions-Policy` apaga cámara, micrófono y ubicación: la plataforma no
 *   los usa, así que nada incrustado debería poder pedirlos.
 * - `Strict-Transport-Security` obliga a HTTPS en las siguientes visitas. Solo
 *   tiene sentido en producción, donde el dominio es https.
 */
export function cabecerasFijas(produccion: boolean): CabeceraSegura[] {
  const cabeceras: CabeceraSegura[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];

  if (produccion) {
    cabeceras.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return cabeceras;
}

/**
 * Política de contenidos.
 *
 * `strict-dynamic` con un número de un solo uso es la forma que recomienda
 * OWASP: en lugar de mantener una lista de dominios —que siempre se queda
 * corta o de más—, solo corren los guiones que la página marcó con el número
 * de esa respuesta, y los que ellos carguen a su vez.
 *
 * Los estilos sí llevan `unsafe-inline`: el marco escribe etiquetas de estilo
 * propias al pintar en el servidor y no todas pasan por el número. Un estilo
 * inyectado puede afear la página, pero no ejecuta código, que es lo que esta
 * política está para impedir.
 *
 * En desarrollo hace falta `unsafe-eval` porque React lo usa para reconstruir
 * los errores del servidor en el navegador; en producción no se incluye.
 */
export function politicaDeContenidos(nonce: string, produccion: boolean): string {
  const guiones = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(produccion ? [] : ["'unsafe-eval'"]),
  ];

  const directivas = [
    "default-src 'self'",
    `script-src ${guiones.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${IMAGENES_EXTERNAS.join(" ")}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    ...(produccion ? ["upgrade-insecure-requests"] : []),
  ];

  return directivas.join("; ");
}

/**
 * Número de un solo uso para la política de contenidos.
 *
 * Tiene que ser impredecible y distinto en cada respuesta: si se repitiera,
 * quien inyectara una etiqueta podría reutilizarlo. `crypto.randomUUID` está
 * disponible tanto en Node como en el runtime del proxy.
 */
export function generarNonce(): string {
  return btoa(crypto.randomUUID());
}
