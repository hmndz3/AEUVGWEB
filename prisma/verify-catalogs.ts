import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  CARRERAS_INICIALES,
  CATEGORIAS_EVENTO_INICIALES,
  FACULTADES_INICIALES,
  ROLES_INICIALES,
} from "./data/catalogos-iniciales";

type Conteo = { cantidad: bigint };
type ValorEnum = { valor: string };

function asegurar(condicion: boolean, mensaje: string): void {
  if (!condicion) {
    throw new Error(mensaje);
  }
}

async function verificarCatalogos(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const codigosFacultad = FACULTADES_INICIALES.map(({ codigo }) => codigo);
    const codigosCarrera = CARRERAS_INICIALES.map(({ codigo }) => codigo);
    const nombresCategoria = CATEGORIAS_EVENTO_INICIALES.map(({ nombre }) => nombre);
    const nombresRol = ROLES_INICIALES.map(({ nombre }) => nombre);

    const [
      totalFacultades,
      totalCarreras,
      totalCategorias,
      totalRoles,
      facultadesIniciales,
      carrerasIniciales,
      categoriasIniciales,
      rolesIniciales,
      facultadesInactivas,
      carrerasInactivas,
      categoriasInactivas,
      rolesInactivos,
      estudiantes,
      usuarios,
      carrerasSinFacultad,
      codigosFacultadDuplicados,
      nombresFacultadDuplicados,
      codigosCarreraDuplicados,
      nombresCategoriaDuplicados,
      nombresRolDuplicados,
      estadosHoraBeca,
    ] = await Promise.all([
      prisma.facultad.count(),
      prisma.carrera.count(),
      prisma.categoriaEvento.count(),
      prisma.rol.count(),
      prisma.facultad.count({ where: { codigo: { in: codigosFacultad } } }),
      prisma.carrera.count({ where: { codigo: { in: codigosCarrera } } }),
      prisma.categoriaEvento.count({ where: { nombre: { in: nombresCategoria } } }),
      prisma.rol.count({ where: { nombre: { in: nombresRol } } }),
      prisma.facultad.count({ where: { codigo: { in: codigosFacultad }, activo: false } }),
      prisma.carrera.count({ where: { codigo: { in: codigosCarrera }, activo: false } }),
      prisma.categoriaEvento.count({ where: { nombre: { in: nombresCategoria }, activo: false } }),
      prisma.rol.count({ where: { nombre: { in: nombresRol }, activo: false } }),
      prisma.estudiante.count(),
      prisma.usuario.count(),
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM carrera AS c
        LEFT JOIN facultad AS f ON f.id_facultad = c.id_facultad
        WHERE f.id_facultad IS NULL
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (SELECT codigo FROM facultad GROUP BY codigo HAVING COUNT(*) > 1) AS duplicados
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (SELECT nombre FROM facultad GROUP BY nombre HAVING COUNT(*) > 1) AS duplicados
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (SELECT codigo FROM carrera GROUP BY codigo HAVING COUNT(*) > 1) AS duplicados
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (SELECT nombre FROM categoria_evento GROUP BY nombre HAVING COUNT(*) > 1) AS duplicados
      `,
      prisma.$queryRaw<Conteo[]>`
        SELECT COUNT(*) AS cantidad
        FROM (SELECT nombre FROM rol GROUP BY nombre HAVING COUNT(*) > 1) AS duplicados
      `,
      prisma.$queryRaw<ValorEnum[]>`
        SELECT enumlabel AS valor
        FROM pg_enum
        INNER JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'estado_hora_beca'
        ORDER BY enumsortorder
      `,
    ]);

    asegurar(facultadesIniciales === FACULTADES_INICIALES.length, "Faltan facultades iniciales.");
    asegurar(carrerasIniciales === CARRERAS_INICIALES.length, "Faltan carreras iniciales.");
    asegurar(
      categoriasIniciales === CATEGORIAS_EVENTO_INICIALES.length,
      "Faltan categorías de eventos iniciales."
    );
    asegurar(rolesIniciales === ROLES_INICIALES.length, "Faltan roles iniciales.");
    asegurar(facultadesInactivas === 0, "Hay facultades iniciales inactivas.");
    asegurar(carrerasInactivas === 0, "Hay carreras iniciales inactivas.");
    asegurar(categoriasInactivas === 0, "Hay categorías iniciales inactivas.");
    asegurar(rolesInactivos === 0, "Hay roles iniciales inactivos.");
    asegurar(
      Number(carrerasSinFacultad[0]?.cantidad ?? 0) === 0,
      "Existen carreras sin una facultad válida."
    );
    asegurar(
      Number(codigosFacultadDuplicados[0]?.cantidad ?? 0) === 0,
      "Existen códigos de facultad duplicados."
    );
    asegurar(
      Number(nombresFacultadDuplicados[0]?.cantidad ?? 0) === 0,
      "Existen nombres de facultad duplicados."
    );
    asegurar(
      Number(codigosCarreraDuplicados[0]?.cantidad ?? 0) === 0,
      "Existen códigos de carrera duplicados."
    );
    asegurar(
      Number(nombresCategoriaDuplicados[0]?.cantidad ?? 0) === 0,
      "Existen categorías duplicadas."
    );
    asegurar(Number(nombresRolDuplicados[0]?.cantidad ?? 0) === 0, "Existen roles duplicados.");
    asegurar(
      estadosHoraBeca.map(({ valor }) => valor).join(",") === "pendiente,acreditada",
      "El enum EstadoHoraBeca no contiene exactamente los valores esperados."
    );

    console.log("Verificación de catálogos completada correctamente.");
    console.log(
      `Facultades: ${totalFacultades} totales; ${facultadesIniciales} iniciales activas.`
    );
    console.log(`Carreras: ${totalCarreras} totales; ${carrerasIniciales} iniciales activas.`);
    console.log(
      `Categorías: ${totalCategorias} totales; ${categoriasIniciales} iniciales activas.`
    );
    console.log(`Roles: ${totalRoles} totales; ${rolesIniciales} iniciales activos.`);
    console.log(`Estados de horas beca: ${estadosHoraBeca.map(({ valor }) => valor).join(", ")}.`);
    console.log(`Carreras sin facultad: ${Number(carrerasSinFacultad[0]?.cantidad ?? 0)}.`);
    console.log(`Datos personales: ${estudiantes} estudiantes y ${usuarios} usuarios.`);
  } finally {
    await prisma.$disconnect();
  }
}

verificarCatalogos().catch((error: unknown) => {
  const connectionString = process.env.DATABASE_URL;
  const mensaje = error instanceof Error ? error.message : String(error);
  const mensajeSeguro = connectionString
    ? mensaje.replaceAll(connectionString, "[DATABASE_URL]")
    : mensaje;

  console.error(`La verificación de catálogos falló: ${mensajeSeguro}`);
  process.exitCode = 1;
});
