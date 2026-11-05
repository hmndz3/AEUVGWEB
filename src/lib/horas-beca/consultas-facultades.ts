import { obtenerPrisma } from "@/lib/prisma";

export type FacultadFiltro = { idFacultad: number; nombre: string };

/**
 * Facultades activas, para el filtro del panel de horas beca.
 *
 * Se listan todas y no solo las que tienen horas registradas: una facultad sin
 * registros en el periodo consultado sigue siendo una opción válida del filtro,
 * y esconderla haría pensar que el filtro está incompleto.
 */
export async function listarFacultades(): Promise<FacultadFiltro[]> {
  return obtenerPrisma().facultad.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { idFacultad: true, nombre: true },
  });
}
