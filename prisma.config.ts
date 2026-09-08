import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` no abre conexión, así que exigir la variable al cargar la
    // configuración impedía generar el cliente durante el build. Los comandos que
    // sí conectan validan DATABASE_URL antes de usarla.
    url: process.env.DATABASE_URL ?? "",
  },
});
