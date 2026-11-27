import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Derivación de contraseñas con scrypt.
 *
 * Los parámetros son una de las combinaciones mínimas que da OWASP para scrypt
 * (A02 del Top 10): con N=2^14 y r=8, subir p a 5 multiplica por cinco el
 * trabajo sin tocar la memoria, que se queda en 16 MB por derivación. Esa es
 * justo la restricción de este despliegue: la plataforma corre en el plan más
 * pequeño de Railway, y las combinaciones de más memoria —N=2^17 pide 128 MB
 * por intento— convertirían un puñado de accesos a la vez en una caída.
 *
 * El hash guarda sus propios parámetros, y la verificación los lee de ahí en
 * lugar de exigir los de hoy. Así subir el costo no deja fuera a nadie: quien
 * tiene una contraseña guardada con los parámetros viejos entra igual, y su
 * hash se rehace con los nuevos en ese mismo acceso (ver `necesitaRehacerse`).
 */
const PARAMETROS_ACTUALES = { N: 16_384, r: 8, p: 5 } as const;

const longitudDerivada = 64;
const longitudSal = 16;

/**
 * Topes de lo que se acepta leer de un hash guardado.
 *
 * Un hash con parámetros disparatados haría que una sola verificación agotara
 * la memoria del proceso. Como el hash sale de la base, el tope es barato y
 * cierra esa puerta por completo.
 */
const MAXIMO_N = 1 << 17;
const MAXIMO_R = 16;
const MAXIMO_P = 16;

/** Memoria que pide scrypt con esos parámetros, que es 128 * N * r. */
const MAXIMA_MEMORIA = 160 * 1024 * 1024;

function derivar(
  contrasena: string,
  sal: Buffer,
  longitud: number,
  opciones: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(contrasena, sal, longitud, opciones, (error, clave) => {
      if (error) reject(error);
      else resolve(clave);
    });
  });
}

export async function crearHashContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(longitudSal);
  const derivada = await derivar(contrasena, sal, longitudDerivada, {
    ...PARAMETROS_ACTUALES,
    maxmem: MAXIMA_MEMORIA,
  });

  return [
    "scrypt",
    PARAMETROS_ACTUALES.N,
    PARAMETROS_ACTUALES.r,
    PARAMETROS_ACTUALES.p,
    sal.toString("base64url"),
    derivada.toString("base64url"),
  ].join("$");
}

type HashLeido = { N: number; r: number; p: number; sal: Buffer; derivada: Buffer };

/** Separa un hash guardado en sus partes, o null si no tiene la forma esperada. */
function leerHash(hashAlmacenado: string): HashLeido | null {
  const [algoritmo, n, r, p, salCodificada, derivadaCodificada] = hashAlmacenado.split("$");

  if (algoritmo !== "scrypt" || !salCodificada || !derivadaCodificada) return null;

  const N = Number(n);
  const erre = Number(r);
  const pe = Number(p);

  const enteroValido = (valor: number, maximo: number) =>
    Number.isInteger(valor) && valor >= 1 && valor <= maximo;

  if (!enteroValido(N, MAXIMO_N) || !enteroValido(erre, MAXIMO_R) || !enteroValido(pe, MAXIMO_P)) {
    return null;
  }
  // N tiene que ser una potencia de dos; scrypt lo exige y además impide que
  // un valor raro dispare la memoria.
  if ((N & (N - 1)) !== 0) return null;

  try {
    const derivada = Buffer.from(derivadaCodificada, "base64url");
    const sal = Buffer.from(salCodificada, "base64url");

    if (derivada.length !== longitudDerivada || sal.length !== longitudSal) return null;

    return { N, r: erre, p: pe, sal, derivada };
  } catch {
    return null;
  }
}

export async function verificarContrasena(
  contrasena: string,
  hashAlmacenado: string
): Promise<boolean> {
  const leido = leerHash(hashAlmacenado);
  if (!leido) return false;

  try {
    const obtenida = await derivar(contrasena, leido.sal, leido.derivada.length, {
      N: leido.N,
      r: leido.r,
      p: leido.p,
      maxmem: MAXIMA_MEMORIA,
    });

    return timingSafeEqual(leido.derivada, obtenida);
  } catch {
    return false;
  }
}

/**
 * True si el hash se guardó con parámetros más flojos que los de hoy.
 *
 * Quien entra con uno así tiene la contraseña correcta en la mano en ese
 * momento, que es la única ocasión en que se puede volver a derivar con el
 * costo nuevo sin pedirle nada.
 */
export function necesitaRehacerse(hashAlmacenado: string): boolean {
  const leido = leerHash(hashAlmacenado);
  if (!leido) return false;

  return (
    leido.N !== PARAMETROS_ACTUALES.N ||
    leido.r !== PARAMETROS_ACTUALES.r ||
    leido.p !== PARAMETROS_ACTUALES.p
  );
}
