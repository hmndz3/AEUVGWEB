import { obtenerPrisma } from "@/lib/prisma";

/** Sugerencias que devuelve el buscador del formulario de horas. */
export const MAXIMO_SUGERENCIAS = 8;

/** Longitud mínima para buscar; con menos, cualquier estudiante coincide. */
export const MINIMO_BUSQUEDA_ESTUDIANTE = 2;

export type EstudianteSugerido = {
  carnet: string;
  nombreCompleto: string;
};

/**
 * Estudiantes que coinciden con lo escrito, para sugerirlos al registrar horas.
 *
 * Devuelve únicamente el carnet y el nombre: es lo que el formulario necesita y
 * así el listado no expone el correo institucional ni el resto de la ficha.
 *
 * La búsqueda es por carnet o por nombre, sin distinguir mayúsculas. No usa una
 * copia normalizada como el resto del sitio porque la tabla de estudiantes no
 * la tiene: aquí el dato que más se escribe es el carnet, que no lleva acentos.
 */
export async function buscarEstudiantes(texto: string): Promise<EstudianteSugerido[]> {
  const consulta = texto.trim();

  if (consulta.length < MINIMO_BUSQUEDA_ESTUDIANTE) return [];

  return obtenerPrisma().estudiante.findMany({
    where: {
      activo: true,
      OR: [
        { carnet: { contains: consulta, mode: "insensitive" } },
        { nombreCompleto: { contains: consulta, mode: "insensitive" } },
      ],
    },
    orderBy: { carnet: "asc" },
    take: MAXIMO_SUGERENCIAS,
    select: { carnet: true, nombreCompleto: true },
  });
}
