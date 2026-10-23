import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { textoDeBusqueda } from "../src/lib/eventos/busqueda";
import { DESPLAZAMIENTO_GUATEMALA, ZONA_HORARIA } from "../src/lib/eventos/formato-fechas";
import { textoDeBusquedaAsociacion } from "../src/lib/organizaciones/busqueda-organizaciones";
import {
  ASOCIACIONES_DEMO,
  EVENTOS_DEMO,
  PREFIJO_IMAGEN_DEMO,
  type EventoDemo,
} from "./data/contenido-demo";

/**
 * Carga o retira el contenido de demostración: cinco asociaciones y doce
 * eventos próximos con logotipos e ilustraciones propias.
 *
 * Sirve para mostrar la plataforma funcionando (el carrusel de la portada, los
 * listados, el calendario) antes de que AEUVG cargue su información real. Los
 * eventos se fechan a partir del día de la carga, así que volver a ejecutarlo
 * los mueve de nuevo al futuro.
 *
 * Es idempotente y nunca toca contenido real: identifica lo suyo por el nombre
 * y por la imagen bajo /demo/. Si ya existe una asociación real con el mismo
 * nombre o las mismas siglas, la omite y lo informa.
 *
 * Uso:
 *   ALLOW_DEMO_CONTENT=true npm run db:contenido-demo               (base local)
 *   ALLOW_DEMO_CONTENT=true npm run db:railway:contenido-demo       (Railway)
 *   npm run db:contenido-demo -- --retirar                          (retirarlo)
 *   npm run db:railway:contenido-demo -- --retirar
 */

const RETIRAR = process.argv.includes("--retirar");

function describirDestino(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `host=${url.host}, base=${url.pathname.slice(1)}`;
  } catch {
    return "destino no interpretable";
  }
}

/** Fecha y hora de Guatemala, a tantos días de hoy. */
function fechaLocal(enDias: number, hora: string): Date {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ZONA_HORARIA,
  }).format(new Date());
  const base = new Date(`${hoy}T${hora}:00${DESPLAZAMIENTO_GUATEMALA}`);

  return new Date(base.getTime() + enDias * 24 * 60 * 60 * 1000);
}

function datosEvento(evento: EventoDemo) {
  const fechaInicio = fechaLocal(evento.enDias, evento.inicio);

  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fechaInicio,
    fechaFin: new Date(fechaInicio.getTime() + evento.horas * 60 * 60 * 1000),
    ubicacion: evento.ubicacion,
    imagenUrl: `${PREFIJO_IMAGEN_DEMO}eventos/${evento.imagen}.svg`,
    tipoActividad: evento.tipoActividad,
    informacionAdicional: evento.informacionAdicional,
    cupo: evento.cupo,
    estado: "PUBLICADO" as const,
    destacado: evento.destacado,
    textoBusqueda: textoDeBusqueda(evento),
  };
}

const esDemo = { imagenUrl: { startsWith: PREFIJO_IMAGEN_DEMO } };

async function cargar(tx: Prisma.TransactionClient) {
  const administrador = await tx.usuario.findFirst({
    where: {
      estado: "ACTIVO",
      roles: { some: { activo: true, rol: { nombre: "ADMINISTRADOR" } } },
    },
    orderBy: { idUsuario: "asc" },
    select: { idUsuario: true },
  });
  if (!administrador) {
    throw new Error("No hay ningún administrador activo que figure como creador de los eventos.");
  }

  const categorias = new Map(
    (await tx.categoriaEvento.findMany({ select: { idCategoriaEvento: true, nombre: true } })).map(
      (categoria) => [categoria.nombre, categoria.idCategoriaEvento]
    )
  );

  // ---- Asociaciones ----
  const idPorClave = new Map<string, number>();

  for (const asociacion of ASOCIACIONES_DEMO) {
    const existente = await tx.asociacion.findUnique({
      where: { nombre: asociacion.nombre },
      select: { idAsociacion: true, imagenUrl: true },
    });

    if (existente && !existente.imagenUrl?.startsWith(PREFIJO_IMAGEN_DEMO)) {
      console.warn(`Omitida: ya existe una asociación real llamada "${asociacion.nombre}".`);
      continue;
    }

    const siglasOcupadas = await tx.asociacion.findFirst({
      where: {
        siglas: { equals: asociacion.siglas, mode: "insensitive" },
        nombre: { not: asociacion.nombre },
      },
      select: { idAsociacion: true },
    });
    if (siglasOcupadas) {
      console.warn(`Omitida: otra asociación ya usa las siglas ${asociacion.siglas}.`);
      continue;
    }

    const datos = {
      nombre: asociacion.nombre,
      siglas: asociacion.siglas,
      descripcion: asociacion.descripcion,
      mision: asociacion.mision,
      vision: asociacion.vision,
      informacionContacto: asociacion.informacionContacto,
      correo: null,
      imagenUrl: asociacion.imagenUrl,
      activo: true,
      textoBusqueda: textoDeBusquedaAsociacion(asociacion),
    };

    const guardada = await tx.asociacion.upsert({
      where: { nombre: asociacion.nombre },
      create: datos,
      update: datos,
      select: { idAsociacion: true },
    });

    idPorClave.set(asociacion.clave, guardada.idAsociacion);
    console.log(`Asociación ${existente ? "actualizada" : "creada"}: ${asociacion.siglas}`);
  }

  // ---- Eventos ----
  for (const evento of EVENTOS_DEMO) {
    const idCategoriaEvento = categorias.get(evento.categoria);
    if (!idCategoriaEvento) {
      throw new Error(
        `Falta la categoría ${evento.categoria}. Ejecuta primero npx prisma db seed.`
      );
    }

    const datos = { ...datosEvento(evento), idCategoriaEvento };
    const existente = await tx.evento.findFirst({
      where: { nombre: evento.nombre, ...esDemo },
      select: { idEvento: true },
    });

    const { idEvento } = existente
      ? await tx.evento.update({
          where: { idEvento: existente.idEvento },
          data: datos,
          select: { idEvento: true },
        })
      : await tx.evento.create({
          data: { ...datos, creadoPor: administrador.idUsuario },
          select: { idEvento: true },
        });

    // Los organizadores se reescriben completos: es la forma más simple de que
    // queden exactamente como dice la definición.
    await tx.organizadorEvento.deleteMany({ where: { idEvento } });

    const organizadores: Prisma.OrganizadorEventoCreateManyInput[] = evento.asociaciones
      .map((clave) => idPorClave.get(clave))
      .filter((id): id is number => id !== undefined)
      .map((idAsociacion, indice) => ({
        idEvento,
        idAsociacion,
        organizadorPrincipal: indice === 0,
      }));
    if (evento.unidadUvg) {
      organizadores.push({
        idEvento,
        unidadUvg: evento.unidadUvg,
        organizadorPrincipal: organizadores.length === 0,
      });
    }
    if (organizadores.length > 0) await tx.organizadorEvento.createMany({ data: organizadores });

    console.log(`Evento ${existente ? "actualizado" : "creado"}: ${evento.nombre}`);
  }
}

async function retirar(tx: Prisma.TransactionClient) {
  const eventos = await tx.evento.deleteMany({
    where: { nombre: { in: EVENTOS_DEMO.map((evento) => evento.nombre) }, ...esDemo },
  });
  console.log(`Eventos de demostración retirados: ${eventos.count}.`);

  for (const asociacion of ASOCIACIONES_DEMO) {
    const registro = await tx.asociacion.findFirst({
      where: { nombre: asociacion.nombre, ...esDemo },
      select: { idAsociacion: true, _count: { select: { eventosOrganizados: true } } },
    });
    if (!registro) continue;

    // Si alguien la usó como organizadora de un evento real, se conserva:
    // borrarla rompería ese evento.
    if (registro._count.eventosOrganizados > 0) {
      console.warn(`Conservada: ${asociacion.siglas} organiza eventos que no son de demostración.`);
      continue;
    }

    await tx.asociacion.delete({ where: { idAsociacion: registro.idAsociacion } });
    console.log(`Asociación retirada: ${asociacion.siglas}`);
  }
}

async function principal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");

  if (!RETIRAR && process.env.ALLOW_DEMO_CONTENT !== "true") {
    throw new Error(
      "Para cargar el contenido de demostración define ALLOW_DEMO_CONTENT=true en el comando."
    );
  }

  console.log(`Destino: ${describirDestino(connectionString)}.`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.$transaction((tx) => (RETIRAR ? retirar(tx) : cargar(tx)), {
      timeout: 60_000,
    });
    console.log(
      RETIRAR ? "Contenido de demostración retirado." : "Contenido de demostración cargado."
    );
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
