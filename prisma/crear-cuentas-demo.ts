import "dotenv/config";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { EstadoUsuario, Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { crearHashContrasena } from "../src/lib/auth/contrasenas";
import { ROLES, type Rol } from "../src/lib/auth/roles";

/**
 * Crea las cuentas de demostración de la plataforma: una de estudiante y una de
 * administrador.
 *
 * A diferencia del seed de datos ficticios, la contraseña NO está en el
 * repositorio: se genera al momento y se escribe en un archivo local ignorado
 * por git. Una contraseña versionada en un repositorio público equivaldría a
 * dejar el panel administrativo abierto.
 *
 * Es idempotente: si una cuenta ya existe, le asigna una contraseña nueva y se
 * asegura de que tenga su rol, quede activa y con el correo verificado.
 *
 * Uso: npm run db:demo          (base local)
 *      npm run db:railway:demo  (base de Railway, con el TCP Proxy habilitado)
 */

const ARCHIVO_SALIDA = "credenciales-demo.local.txt";
const MARCADOR = "[DEMO]";

type DefinicionCuenta = {
  clave: string;
  carnet: string;
  nombreCompleto: string;
  correo: string;
  roles: Rol[];
};

const CUENTAS: DefinicionCuenta[] = [
  {
    clave: "Estudiante",
    carnet: "DEMO-0001",
    nombreCompleto: `${MARCADOR} Estudiante de Demostración`,
    correo: "demo.estudiante@uvg.edu.gt",
    roles: [ROLES.estudiante],
  },
  {
    clave: "Administrador",
    carnet: "DEMO-0002",
    nombreCompleto: `${MARCADOR} Administrador de Demostración`,
    correo: "demo.admin@uvg.edu.gt",
    roles: [ROLES.estudiante, ROLES.administrador],
  },
];

/** Contraseña aleatoria que cumple las reglas del registro. */
function generarContrasena(): string {
  const alfabeto = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const simbolos = "!@#$%&*?";
  const bytes = randomBytes(24);
  const cuerpo = Array.from(bytes, (byte) => alfabeto[byte % alfabeto.length]).join("");

  // Se garantizan los cuatro tipos que exige la validación del registro.
  return `A${cuerpo}9${simbolos[randomBytes(1)[0] % simbolos.length]}`;
}

async function principal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const generadas: { cuenta: DefinicionCuenta; contrasena: string; accion: string }[] = [];

  try {
    for (const cuenta of CUENTAS) {
      const contrasena = generarContrasena();
      const contrasenaHash = await crearHashContrasena(contrasena);

      const accion = await prisma.$transaction(
        async (tx) => {
          const roles = await tx.rol.findMany({
            where: { nombre: { in: cuenta.roles, mode: "insensitive" } },
            select: { idRol: true, nombre: true },
          });

          if (roles.length !== cuenta.roles.length) {
            throw new Error(
              "Faltan roles en el catálogo. Ejecuta primero la carga de catálogos iniciales."
            );
          }

          const existente = await tx.usuario.findUnique({
            where: { correo: cuenta.correo },
            select: { idUsuario: true },
          });

          let idUsuario: number;
          let accion: string;

          if (existente) {
            await tx.usuario.update({
              where: { idUsuario: existente.idUsuario },
              data: {
                contrasenaHash,
                estado: EstadoUsuario.ACTIVO,
                correoVerificado: true,
              },
            });
            idUsuario = existente.idUsuario;
            accion = "actualizada";
          } else {
            const carrera = await tx.carrera.findFirstOrThrow({
              where: { activo: true },
              orderBy: { idCarrera: "asc" },
              select: { idCarrera: true },
            });
            const estudiante = await tx.estudiante.upsert({
              where: { carnet: cuenta.carnet },
              create: {
                carnet: cuenta.carnet,
                nombreCompleto: cuenta.nombreCompleto,
                correoUvg: cuenta.correo,
                idCarrera: carrera.idCarrera,
              },
              update: { nombreCompleto: cuenta.nombreCompleto },
              select: { idEstudiante: true },
            });
            const usuario = await tx.usuario.create({
              data: {
                idEstudiante: estudiante.idEstudiante,
                correo: cuenta.correo,
                contrasenaHash,
                estado: EstadoUsuario.ACTIVO,
                correoVerificado: true,
              },
              select: { idUsuario: true },
            });
            idUsuario = usuario.idUsuario;
            accion = "creada";
          }

          for (const rol of roles) {
            await tx.usuarioRol.upsert({
              where: { idUsuario_idRol: { idUsuario, idRol: rol.idRol } },
              create: { idUsuario, idRol: rol.idRol },
              update: { activo: true },
            });
          }

          return accion;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      generadas.push({ cuenta, contrasena, accion });
      console.log(`${cuenta.clave}: ${cuenta.correo} — ${accion}`);
    }

    const lineas = [
      "Credenciales de demostración de la plataforma AEUVG",
      `Generadas el ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
      "",
      "Este archivo NO se versiona. No compartas su contenido por chat ni por correo.",
      "Vuelve a ejecutar el comando cuando quieras rotar las contraseñas.",
      "",
      ...generadas.flatMap(({ cuenta, contrasena }) => [
        `${cuenta.clave}`,
        `  correo:     ${cuenta.correo}`,
        `  contraseña: ${contrasena}`,
        `  roles:      ${cuenta.roles.join(", ")}`,
        "",
      ]),
    ];

    writeFileSync(ARCHIVO_SALIDA, lineas.join("\n"), { encoding: "utf8", mode: 0o600 });

    console.log("");
    console.log(`Las contraseñas quedaron en ${ARCHIVO_SALIDA} (ignorado por git).`);
    console.log("Ábrelo para copiarlas; no se imprimen en pantalla a propósito.");
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  const url = process.env.DATABASE_URL;

  console.error(
    `No se pudieron crear las cuentas: ${url ? mensaje.replaceAll(url, "[DATABASE_URL]") : mensaje}`
  );
  process.exitCode = 1;
});
