import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  CARRERAS_INICIALES,
  CATEGORIAS_EVENTO_INICIALES,
  FACULTADES_INICIALES,
  ROLES_INICIALES,
} from "./data/catalogos-iniciales";

type ResultadoCarga = {
  procesados: number;
  creados: number;
  actualizados: number;
  sinCambios: number;
};

function nuevoResultado(procesados: number): ResultadoCarga {
  return { procesados, creados: 0, actualizados: 0, sinCambios: 0 };
}

function validarUnicidad(valores: readonly string[], etiqueta: string): void {
  if (new Set(valores).size !== valores.length) {
    throw new Error(`El catálogo contiene ${etiqueta} duplicados.`);
  }
}

function validarDatosIniciales(): void {
  validarUnicidad(
    FACULTADES_INICIALES.map(({ codigo }) => codigo),
    "códigos de facultad"
  );
  validarUnicidad(
    FACULTADES_INICIALES.map(({ nombre }) => nombre),
    "nombres de facultad"
  );
  validarUnicidad(
    CARRERAS_INICIALES.map(({ codigo }) => codigo),
    "códigos de carrera"
  );
  validarUnicidad(
    CATEGORIAS_EVENTO_INICIALES.map(({ nombre }) => nombre),
    "nombres de categoría"
  );
  validarUnicidad(
    ROLES_INICIALES.map(({ nombre }) => nombre),
    "nombres de rol"
  );

  const codigosFacultad = new Set(FACULTADES_INICIALES.map(({ codigo }) => codigo));
  const carreraSinFacultad = CARRERAS_INICIALES.find(
    ({ codigoFacultad }) => !codigosFacultad.has(codigoFacultad)
  );

  if (carreraSinFacultad) {
    throw new Error(
      `La carrera ${carreraSinFacultad.codigo} referencia una facultad inexistente: ${carreraSinFacultad.codigoFacultad}.`
    );
  }

  const categoriaConColorInvalido = CATEGORIAS_EVENTO_INICIALES.find(
    ({ color }) => !/^#[0-9A-F]{6}$/.test(color)
  );

  if (categoriaConColorInvalido) {
    throw new Error(
      `La categoría ${categoriaConColorInvalido.nombre} tiene un color hexadecimal inválido.`
    );
  }
}

async function cargarFacultades(tx: Prisma.TransactionClient): Promise<ResultadoCarga> {
  const resultado = nuevoResultado(FACULTADES_INICIALES.length);

  for (const facultad of FACULTADES_INICIALES) {
    const existente = await tx.facultad.findUnique({ where: { codigo: facultad.codigo } });

    if (!existente) {
      await tx.facultad.create({ data: facultad });
      resultado.creados += 1;
    } else if (existente.nombre !== facultad.nombre || existente.activo !== facultad.activo) {
      await tx.facultad.update({ where: { codigo: facultad.codigo }, data: facultad });
      resultado.actualizados += 1;
    } else {
      resultado.sinCambios += 1;
    }
  }

  return resultado;
}

async function cargarCarreras(tx: Prisma.TransactionClient): Promise<ResultadoCarga> {
  const resultado = nuevoResultado(CARRERAS_INICIALES.length);
  const facultades = await tx.facultad.findMany({
    where: { codigo: { in: FACULTADES_INICIALES.map(({ codigo }) => codigo) } },
    select: { idFacultad: true, codigo: true },
  });
  const facultadesPorCodigo = new Map(
    facultades.map((facultad) => [facultad.codigo, facultad.idFacultad])
  );

  for (const carrera of CARRERAS_INICIALES) {
    const idFacultad = facultadesPorCodigo.get(carrera.codigoFacultad);

    if (idFacultad === undefined) {
      throw new Error(
        `No se encontró la facultad ${carrera.codigoFacultad} para la carrera ${carrera.codigo}.`
      );
    }

    const datos = {
      codigo: carrera.codigo,
      nombre: carrera.nombre,
      activo: carrera.activo,
      idFacultad,
    };
    const existente = await tx.carrera.findUnique({ where: { codigo: carrera.codigo } });

    if (!existente) {
      await tx.carrera.create({ data: datos });
      resultado.creados += 1;
    } else if (
      existente.nombre !== datos.nombre ||
      existente.activo !== datos.activo ||
      existente.idFacultad !== datos.idFacultad
    ) {
      await tx.carrera.update({ where: { codigo: carrera.codigo }, data: datos });
      resultado.actualizados += 1;
    } else {
      resultado.sinCambios += 1;
    }
  }

  return resultado;
}

async function cargarCategorias(tx: Prisma.TransactionClient): Promise<ResultadoCarga> {
  const resultado = nuevoResultado(CATEGORIAS_EVENTO_INICIALES.length);

  for (const categoria of CATEGORIAS_EVENTO_INICIALES) {
    const existente = await tx.categoriaEvento.findUnique({ where: { nombre: categoria.nombre } });

    if (!existente) {
      await tx.categoriaEvento.create({ data: categoria });
      resultado.creados += 1;
    } else if (
      existente.descripcion !== categoria.descripcion ||
      existente.color !== categoria.color ||
      existente.activo !== categoria.activo
    ) {
      await tx.categoriaEvento.update({ where: { nombre: categoria.nombre }, data: categoria });
      resultado.actualizados += 1;
    } else {
      resultado.sinCambios += 1;
    }
  }

  return resultado;
}

async function cargarRoles(tx: Prisma.TransactionClient): Promise<ResultadoCarga> {
  const resultado = nuevoResultado(ROLES_INICIALES.length);

  for (const rol of ROLES_INICIALES) {
    const existente = await tx.rol.findUnique({ where: { nombre: rol.nombre } });

    if (!existente) {
      await tx.rol.create({ data: rol });
      resultado.creados += 1;
    } else if (existente.descripcion !== rol.descripcion || existente.activo !== rol.activo) {
      await tx.rol.update({ where: { nombre: rol.nombre }, data: rol });
      resultado.actualizados += 1;
    } else {
      resultado.sinCambios += 1;
    }
  }

  return resultado;
}

function imprimirResultado(nombre: string, resultado: ResultadoCarga): void {
  console.log(
    `${nombre}: ${resultado.procesados} procesados; ${resultado.creados} creados; ${resultado.actualizados} actualizados; ${resultado.sinCambios} sin cambios.`
  );
}

async function ejecutarSeed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  validarDatosIniciales();

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const resultados = await prisma.$transaction(
      async (tx) => {
        const facultades = await cargarFacultades(tx);
        const carreras = await cargarCarreras(tx);
        const categorias = await cargarCategorias(tx);
        const roles = await cargarRoles(tx);

        return { facultades, carreras, categorias, roles };
      },
      // La carga recorre los catálogos registro por registro. Ejecutada contra
      // una base remota, la latencia de cada consulta supera el timeout de
      // cinco segundos que Prisma aplica por defecto.
      { maxWait: 15_000, timeout: 120_000 }
    );

    console.log("Catálogos iniciales cargados correctamente.");
    imprimirResultado("Facultades", resultados.facultades);
    imprimirResultado("Carreras", resultados.carreras);
    imprimirResultado("Categorías de eventos", resultados.categorias);
    imprimirResultado("Roles", resultados.roles);
    console.log(
      "Estados de horas beca: PENDIENTE y ACREDITADA (enum EstadoHoraBeca; sin filas que insertar)."
    );
  } finally {
    await prisma.$disconnect();
  }
}

ejecutarSeed().catch((error: unknown) => {
  const connectionString = process.env.DATABASE_URL;
  const mensaje = error instanceof Error ? error.message : String(error);
  const mensajeSeguro = connectionString
    ? mensaje.replaceAll(connectionString, "[DATABASE_URL]")
    : mensaje;

  console.error(`No se pudieron cargar los catálogos iniciales: ${mensajeSeguro}`);
  process.exitCode = 1;
});
