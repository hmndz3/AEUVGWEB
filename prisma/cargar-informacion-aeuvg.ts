import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { INFORMACION_AEUVG, JUNTA_DIRECTIVA_AEUVG } from "./data/informacion-aeuvg";

/**
 * Carga la información institucional de AEUVG y su Junta Directiva.
 *
 * Es idempotente: crea lo que falta, actualiza lo que difiere y desactiva a
 * quienes ya no forman parte de la junta, sin borrar su registro histórico.
 * Puede volver a ejecutarse cada vez que cambie la junta.
 */
async function principal() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const asociacion = await prisma.asociacion.upsert({
      where: { nombre: INFORMACION_AEUVG.nombre },
      create: {
        nombre: INFORMACION_AEUVG.nombre,
        descripcion: INFORMACION_AEUVG.descripcion,
        mision: INFORMACION_AEUVG.mision,
        vision: INFORMACION_AEUVG.vision,
        activo: true,
      },
      update: {
        descripcion: INFORMACION_AEUVG.descripcion,
        mision: INFORMACION_AEUVG.mision,
        vision: INFORMACION_AEUVG.vision,
        activo: true,
      },
      select: { idAsociacion: true },
    });

    let creados = 0;
    let actualizados = 0;

    for (const integrante of JUNTA_DIRECTIVA_AEUVG) {
      const existente = await prisma.integranteAsociacion.findFirst({
        where: { idAsociacion: asociacion.idAsociacion, nombre: integrante.nombre },
        select: { idIntegrante: true },
      });

      if (existente) {
        await prisma.integranteAsociacion.update({
          where: { idIntegrante: existente.idIntegrante },
          data: { ...integrante, activo: true },
        });
        actualizados += 1;
      } else {
        await prisma.integranteAsociacion.create({
          data: { ...integrante, idAsociacion: asociacion.idAsociacion, activo: true },
        });
        creados += 1;
      }
    }

    // Quien ya no aparece en la lista deja de mostrarse, pero su registro se
    // conserva: la página institucional filtra por integrantes activos.
    const { count: retirados } = await prisma.integranteAsociacion.updateMany({
      where: {
        idAsociacion: asociacion.idAsociacion,
        activo: true,
        nombre: { notIn: JUNTA_DIRECTIVA_AEUVG.map(({ nombre }) => nombre) },
      },
      data: { activo: false },
    });

    console.log(
      `Información de AEUVG cargada. Integrantes creados: ${creados}, actualizados: ${actualizados}, retirados: ${retirados}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  console.error("No se pudo cargar la información de AEUVG.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
