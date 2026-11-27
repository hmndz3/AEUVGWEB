/**
 * Límite de intentos por ventana de tiempo.
 *
 * Es la respuesta a A04 y A07 del OWASP Top 10: sin un tope, el formulario de
 * acceso se puede probar en bucle hasta acertar una contraseña, y el de
 * recuperación se puede usar para llenarle el correo a cualquiera. El tope no
 * impide un intento legítimo —quien se equivoca dos veces sigue entrando—,
 * pero convierte un ataque de miles de intentos en algo inviable.
 *
 * El conteo vive en memoria del proceso. Con un solo contenedor, que es como
 * corre la plataforma, basta; si algún día hubiera varios, cada uno llevaría
 * su cuenta y el tope real sería el tope por el número de contenedores. Queda
 * dicho aquí para que quien lo escale lo sepa.
 */

type RegistroIntentos = { intentos: number; expiraEn: number };

export class Limitador {
  private readonly registros = new Map<string, RegistroIntentos>();

  constructor(
    private readonly maximo: number,
    private readonly ventanaMilisegundos: number
  ) {}

  /** True si todavía quedan intentos para esa clave. */
  permitir(clave: string, fecha = new Date()): boolean {
    this.limpiar(fecha);
    return (this.registros.get(clave)?.intentos ?? 0) < this.maximo;
  }

  /**
   * Cuenta un intento.
   *
   * La ventana se reinicia con cada intento a propósito: quien sigue probando
   * no se acerca al momento en que podrá volver a probar.
   */
  registrar(clave: string, fecha = new Date()): void {
    this.limpiar(fecha);
    const actual = this.registros.get(clave);
    this.registros.set(clave, {
      intentos: (actual?.intentos ?? 0) + 1,
      expiraEn: fecha.getTime() + this.ventanaMilisegundos,
    });
  }

  /** Olvida los intentos de esa clave; se llama cuando la acción sale bien. */
  reiniciar(clave: string): void {
    this.registros.delete(clave);
  }

  /** Segundos que faltan para poder volver a intentar, para la cabecera Retry-After. */
  segundosDeEspera(clave: string, fecha = new Date()): number {
    const registro = this.registros.get(clave);
    if (!registro) return 0;

    return Math.max(1, Math.ceil((registro.expiraEn - fecha.getTime()) / 1000));
  }

  private limpiar(fecha: Date): void {
    for (const [clave, registro] of this.registros) {
      if (registro.expiraEn <= fecha.getTime()) this.registros.delete(clave);
    }
  }
}

const MINUTO = 60_000;

/**
 * Topes de cada formulario.
 *
 * El de acceso lleva dos: uno por dirección y correo, que es el que protege a
 * una cuenta concreta, y otro por dirección sola, que es el que corta a quien
 * prueba muchos correos distintos desde el mismo sitio. Sin el segundo, probar
 * una contraseña común contra cientos de cuentas no tropezaría con ningún
 * límite.
 */
export const limitadorIniciosSesion = new Limitador(5, 15 * MINUTO);
export const limitadorPorDireccion = new Limitador(30, 15 * MINUTO);

/** Alta de cuentas: evita que alguien llene la base de registros a medio verificar. */
export const limitadorRegistro = new Limitador(5, 60 * MINUTO);

/**
 * Correos que la plataforma envía a petición de quien no ha iniciado sesión.
 * El tope es lo que impide usarlos para inundar el buzón de otra persona.
 */
export const limitadorCorreos = new Limitador(5, 60 * MINUTO);

/** Canje de un token: el tope es lo que impide probarlo a ciegas. */
export const limitadorTokens = new Limitador(10, 15 * MINUTO);

/**
 * Dirección desde la que llega la petición.
 *
 * Detrás del proxy de Railway la dirección real viaja en `x-forwarded-for`; se
 * toma la primera, que es la del cliente. Quien la falsifique solo consigue
 * repartir sus intentos entre varias claves, nunca saltarse el tope de la
 * cuenta concreta, que además lleva el correo.
 */
export function direccionDelCliente(solicitud: Request): string {
  const reenviada = solicitud.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return reenviada || solicitud.headers.get("x-real-ip") || "desconocida";
}

/** Respuesta estándar cuando se agotan los intentos. */
export function respuestaDemasiadosIntentos(segundos: number): Response {
  return Response.json(
    { mensaje: "Demasiados intentos. Intenta de nuevo más tarde." },
    {
      status: 429,
      headers: { "Retry-After": String(segundos), "Cache-Control": "no-store" },
    }
  );
}
