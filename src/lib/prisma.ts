import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// En desarrollo el hot reload reevalúa este módulo en cada cambio; sin la
// referencia global, cada recarga abriría un pool de conexiones adicional.
const global = globalThis as typeof globalThis & { prisma?: PrismaClient };

/**
 * Devuelve el cliente de Prisma, creándolo la primera vez que se solicita.
 * La creación es diferida porque Next evalúa los módulos de ruta durante el
 * build, cuando DATABASE_URL todavía no está disponible.
 */
export function obtenerPrisma(): PrismaClient {
  if (global.prisma) {
    return global.prisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const cliente = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  global.prisma = cliente;

  return cliente;
}
