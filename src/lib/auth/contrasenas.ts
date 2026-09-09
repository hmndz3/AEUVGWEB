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

  const esperada = Buffer.from(derivadaCodificada, "base64url");
  const obtenida = await derivar(
    contrasena,
    Buffer.from(salCodificada, "base64url"),
    esperada.length,
    {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    }
  );

  return esperada.length === obtenida.length && timingSafeEqual(esperada, obtenida);
}
