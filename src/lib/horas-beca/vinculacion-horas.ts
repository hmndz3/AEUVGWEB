import { normalizarCarnet } from "@/lib/horas-beca/busqueda-horas";

/**
 * Lo mínimo que necesita la vinculación de un cliente de Prisma.
 *
 * Se declara así, y no como `PrismaClient`, porque la vinculación se ejecuta
 * dentro de la transacción que crea la cuenta: el parámetro recibe tanto el
 * cliente como el cliente de la transacción, y de paso puede probarse con un
 * doble sin levantar una base de datos.
 */
export type ClienteVinculacionHoras = {
  registroHoraBeca: {
    updateMany(argumentos: {
      where: { carnet: { equals: string; mode: "insensitive" }; idEstudiante: null };
      data: { idEstudiante: number };
    }): Promise<{ count: number }>;
  };
};

/**
 * Vincula a una cuenta recién creada los registros de horas de su carnet.
 *
 * Es la otra mitad de la asociación por carnet: al guardar un registro se busca
 * la cuenta, y aquí, al crearse la cuenta, se buscan los registros. Sin esta
 * mitad, las horas que AEUVG cargó antes de que el estudiante se registrara
 * nunca aparecerían en su perfil, y son justamente las que ya tiene cargadas de
 * sus hojas de cálculo.
 *
 * Solo alcanza los registros sin vínculo: uno ya vinculado pertenece a una
 * cuenta y no debe cambiar de dueño porque alguien se registre con un carnet
 * repetido. La comparación ignora mayúsculas, igual que la búsqueda de la
 * cuenta, porque el registro guarda el carnet normalizado y la ficha del
 * estudiante conserva el que se capturó.
 */
export async function vincularRegistrosDeCarnet(
  cliente: ClienteVinculacionHoras,
  carnet: string,
  idEstudiante: number
): Promise<number> {
  const normalizado = normalizarCarnet(carnet);

  if (normalizado.length === 0) return 0;

  const { count } = await cliente.registroHoraBeca.updateMany({
    where: { carnet: { equals: normalizado, mode: "insensitive" }, idEstudiante: null },
    data: { idEstudiante },
  });

  return count;
}
