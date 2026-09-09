import type { Rol } from "@/lib/auth/roles";

/** Forma del usuario que devuelve GET /api/auth/sesion. */
export type UsuarioSesionCliente = {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  roles: Rol[];
};

export async function consultarSesion(senal?: AbortSignal): Promise<UsuarioSesionCliente | null> {
  const respuesta = await fetch("/api/auth/sesion", {
    cache: "no-store",
    signal: senal,
  });

  if (!respuesta.ok) return null;

  const cuerpo = (await respuesta.json()) as { usuario?: UsuarioSesionCliente };
  return cuerpo.usuario ?? null;
}

export async function cerrarSesion(): Promise<boolean> {
  const respuesta = await fetch("/api/auth/sesion", { method: "DELETE" });
  return respuesta.ok;
}

/** Iniciales para el avatar; la plataforma no almacena foto de perfil. */
export function inicialesDe(nombreCompleto: string): string {
  const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";

  const primera = palabras[0][0] ?? "";
  const segunda = palabras.length > 1 ? (palabras[1][0] ?? "") : "";

  return (primera + segunda).toUpperCase();
}
