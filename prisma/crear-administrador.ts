import "dotenv/config";
import { EstadoUsuario, Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { crearHashContrasena } from "../src/lib/auth/contrasenas";
import { ROLES } from "../src/lib/auth/roles";

/**
 * Crea o promueve una cuenta de administrador de AEUVG.
 *
 * La contraseña se lee de ADMIN_PASSWORD y nunca se pasa como argumento, para
 * que no quede en el historial del shell ni en la lista de procesos.
 *
 * Uso:
 *   ADMIN_PASSWORD='...' npx tsx prisma/crear-administrador.ts \
 *     --carnet 24089 --nombre "Nombre Apellido" --correo persona@uvg.edu.gt
 *
 * Es idempotente: si la cuenta existe, solo le asigna el rol de administrador
 * y la deja activa, sin tocar su contraseña.
 */

function leerArgumento(nombre: string): string | undefined {
  const indice = process.argv.indexOf(`--${nombre}`);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

function exigir(valor: string | undefined, mensaje: string): string {
  if (!valor?.trim()) throw new Error(mensaje);
  return valor.trim();
}

async function principal() {
  const carnet = exigir(leerArgumento("carnet"), "Falta --carnet.");
  const nombreCompleto = exigir(leerArgumento("nombre"), "Falta --nombre.");
  const correo = exigir(leerArgumento("correo"), "Falta --correo.").toLocaleLowerCase("en-US");
  const connectionString = exigir(process.env.DATABASE_URL, "DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const resumen = await prisma.$transaction(
      async (tx) => {
        const rol = await tx.rol.findFirst({
          where: { nombre: { equals: ROLES.administrador, mode: "insensitive" } },
          select: { idRol: true },
        });

        if (!rol) {
          throw new Error(
            "El rol ADMINISTRADOR no existe. Carga primero los catálogos con `prisma db seed`."
          );
        }

        const existente = await tx.usuario.findUnique({
          where: { correo },
          select: { idUsuario: true },
        });

        if (existente) {
          await tx.usuario.update({
            where: { idUsuario: existente.idUsuario },
            data: { estado: EstadoUsuario.ACTIVO, correoVerificado: true },
          });
          await tx.usuarioRol.upsert({
            where: { idUsuario_idRol: { idUsuario: existente.idUsuario, idRol: rol.idRol } },
            create: { idUsuario: existente.idUsuario, idRol: rol.idRol },
            update: { activo: true },
          });

          return { accion: "promovida" as const, correo };
        }

        const contrasena = exigir(
          process.env.ADMIN_PASSWORD,
          "Define ADMIN_PASSWORD para crear una cuenta nueva."
        );

        if (contrasena.length < 12) {
          throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres.");
        }

        const estudianteExistente = await tx.estudiante.findUnique({
          where: { carnet },
          select: { idEstudiante: true },
        });
        const idEstudiante =
          estudianteExistente?.idEstudiante ??
          (
            await tx.estudiante.create({
              data: {
                carnet,
                nombreCompleto,
                correoUvg: correo,
                idCarrera: (
                  await tx.carrera.findFirstOrThrow({
                    where: { activo: true },
                    orderBy: { idCarrera: "asc" },
                    select: { idCarrera: true },
                  })
                ).idCarrera,
              },
            })
          ).idEstudiante;

        const usuario = await tx.usuario.create({
          data: {
            idEstudiante,
            correo,
            contrasenaHash: await crearHashContrasena(contrasena),
            estado: EstadoUsuario.ACTIVO,
            correoVerificado: true,
            roles: { create: { idRol: rol.idRol } },
          },
        });

        return { accion: "creada" as const, correo: usuario.correo };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    console.log(
      resumen.accion === "creada"
        ? `Cuenta de administrador creada para ${resumen.correo}.`
        : `La cuenta ${resumen.correo} ya existía; se activó y se le asignó el rol de administrador.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  const connectionString = process.env.DATABASE_URL;

  console.error(
    `No se pudo crear la cuenta: ${
      connectionString ? mensaje.replaceAll(connectionString, "[DATABASE_URL]") : mensaje
    }`
  );
  process.exitCode = 1;
});
