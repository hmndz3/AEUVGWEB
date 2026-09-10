import { NOMBRE_ASOCIACION_GENERAL } from "@/lib/inicio/consultas-inicio";
import { obtenerPrisma } from "@/lib/prisma";

export type IntegranteResumen = {
  idIntegrante: number;
  nombre: string;
  cargo: string;
  periodo: string;
  fotoUrl: string | null;
};

export type AsociacionGeneral = {
  nombre: string;
  descripcion: string | null;
  mision: string | null;
  vision: string | null;
  correo: string | null;
  informacionContacto: string | null;
  integrantes: IntegranteResumen[];
};

/**
 * Datos de la asociación general para la página institucional. Devuelve null
 * mientras AEUVG no entregue su información y no exista el registro (AEUVG-40).
 */
export async function obtenerAsociacionGeneral(): Promise<AsociacionGeneral | null> {
  try {
    return await obtenerPrisma().asociacion.findFirst({
      where: {
        activo: true,
        nombre: { equals: NOMBRE_ASOCIACION_GENERAL, mode: "insensitive" },
      },
      select: {
        nombre: true,
        descripcion: true,
        mision: true,
        vision: true,
        correo: true,
        informacionContacto: true,
        integrantes: {
          where: { activo: true },
          orderBy: [{ ordenVisualizacion: "asc" }, { nombre: "asc" }],
          select: {
            idIntegrante: true,
            nombre: true,
            cargo: true,
            periodo: true,
            fotoUrl: true,
          },
        },
      },
    });
  } catch {
    // La página institucional es pública: ante un fallo muestra los bloques
    // pendientes en lugar de responder con un error.
    return null;
  }
}

/** Iniciales para quienes no tienen fotografía registrada. */
export function inicialesDeNombre(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";

  return (
    (palabras[0][0] ?? "") + (palabras.length > 1 ? (palabras[1][0] ?? "") : "")
  ).toUpperCase();
}
