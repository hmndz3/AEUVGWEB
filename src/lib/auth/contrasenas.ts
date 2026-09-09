import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
const parametros = { N: 16_384, r: 8, p: 1 } as const;
const longitudDerivada = 64;

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
  const sal = randomBytes(16);
  const derivada = await derivar(contrasena, sal, longitudDerivada, parametros);

  return [
    "scrypt",
    parametros.N,
    parametros.r,
    parametros.p,
    sal.toString("base64url"),
    derivada.toString("base64url"),
  ].join("$");
}

/** Se deja lista para que T-04.3 autentique sin cambiar el formato almacenado. */
export async function verificarContrasena(contrasena: string, hashAlmacenado: string) {
  const [algoritmo, n, r, p, salCodificada, derivadaCodificada] = hashAlmacenado.split("$");

  if (algoritmo !== "scrypt" || !salCodificada || !derivadaCodificada) return false;

  if (Number(n) !== parametros.N || Number(r) !== parametros.r || Number(p) !== parametros.p) {
    return false;
  }

  try {
    const esperada = Buffer.from(derivadaCodificada, "base64url");
    const sal = Buffer.from(salCodificada, "base64url");

    if (esperada.length !== longitudDerivada || sal.length !== 16) return false;

    const obtenida = await derivar(contrasena, sal, esperada.length, parametros);
    return timingSafeEqual(esperada, obtenida);
  } catch {
    return false;
  }
}
