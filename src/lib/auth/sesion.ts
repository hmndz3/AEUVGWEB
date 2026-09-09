import { randomUUID } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

import type { ConfiguracionSesion } from "@/lib/configuracion-sesion";

export const NOMBRE_COOKIE_SESION = "aeuvg_session";
const emisor = "aeuvg-web";
const audiencia = "aeuvg-web";

export type DatosSesion = { idUsuario: number };

function claveSesion(secreto: string): Uint8Array {
  return new TextEncoder().encode(secreto);
}

export async function crearTokenSesion(
  datos: DatosSesion,
  configuracion: ConfiguracionSesion,
  fecha = new Date()
): Promise<string> {
  const emitidoEn = Math.floor(fecha.getTime() / 1000);

  return new SignJWT()
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(emisor)
    .setAudience(audiencia)
    .setSubject(String(datos.idUsuario))
    .setJti(randomUUID())
    .setIssuedAt(emitidoEn)
    .setExpirationTime(emitidoEn + configuracion.duracionSegundos)
    .sign(claveSesion(configuracion.secreto));
}

export async function validarTokenSesion(
  token: string | undefined,
  configuracion: ConfiguracionSesion,
  fecha = new Date()
): Promise<DatosSesion | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, claveSesion(configuracion.secreto), {
      issuer: emisor,
      audience: audiencia,
      currentDate: fecha,
    });
    const idUsuario = Number(payload.sub);

    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) return null;
    return { idUsuario };
  } catch {
    return null;
  }
}

export function opcionesCookieSesion(configuracion: ConfiguracionSesion) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: configuracion.duracionSegundos,
  };
}
