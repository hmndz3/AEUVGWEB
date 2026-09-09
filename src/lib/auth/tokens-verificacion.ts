import { createHash, randomBytes } from "node:crypto";

export function crearTokenVerificacion() {
  const token = randomBytes(32).toString("base64url");

  return { token, tokenHash: crearHashToken(token) };
}

export function crearHashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function calcularExpiracion(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000);
}
