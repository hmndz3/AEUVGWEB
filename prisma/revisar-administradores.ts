import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { ROLES } from "../src/lib/auth/roles";

/**
 * Lista las cuentas con rol de administrador. Solo lectura: sirve para saber
 * quién tiene acceso al panel sin abrir un cliente de base de datos.
 *
 * Uso: npm run db:railway:admins
 */
async function principal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const administradores = await prisma.usuario.findMany({
      where: {
        roles: {
          some: {
            activo: true,
            rol: { nombre: { equals: ROLES.administrador, mode: "insensitive" }, activo: true },
          },
        },
      },
      select: {
        correo: true,
        estado: true,
        correoVerificado: true,
        ultimoAcceso: true,
        estudiante: { select: { nombreCompleto: true, carnet: true } },
      },
      orderBy: { correo: "asc" },
    });

    if (administradores.length === 0) {
      console.log("No hay ninguna cuenta con rol de administrador.");
      return;
    }

    console.log(`Cuentas con rol de administrador: ${administradores.length}`);
    for (const cuenta of administradores) {
      const acceso = cuenta.ultimoAcceso
        ? cuenta.ultimoAcceso.toISOString().slice(0, 16).replace("T", " ")
        : "nunca";
      console.log(
        `  ${cuenta.correo} | ${cuenta.estudiante.nombreCompleto} (${cuenta.estudiante.carnet}) | ` +
          `estado ${cuenta.estado} | correo ${cuenta.correoVerificado ? "verificado" : "sin verificar"} | último acceso: ${acceso}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  const url = process.env.DATABASE_URL;
  console.error(
    `No se pudo consultar: ${url ? mensaje.replaceAll(url, "[DATABASE_URL]") : mensaje}`
  );
  process.exitCode = 1;
});
