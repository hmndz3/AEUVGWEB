import type { PrismaClient } from "@prisma/client";

import type { ListasPlantilla } from "@/lib/eventos/plantilla-eventos";
import {
  RepositorioEventosPrisma,
  type DatosEventoPersistidos,
  type OrganizadorNuevo,
} from "@/lib/eventos/repositorio-eventos";
import { claveDeEvento, type CatalogosEventos } from "@/lib/eventos/validacion-importacion-eventos";
import { normalizarTexto } from "@/lib/busqueda-texto";
import { obtenerPrisma } from "@/lib/prisma";

export interface RepositorioImportacionEventos {
  /** Catálogos contra los que se resuelven los nombres de la hoja. */
  catalogos(): Promise<CatalogosEventos>;
  /** Listas legibles para la hoja de ayuda de la plantilla. */
  listas(): Promise<ListasPlantilla>;
  /** Claves de los eventos ya creados, para no duplicarlos. */
  clavesExistentes(): Promise<string[]>;
  crear(
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[],
    creadoPor: number
  ): Promise<number>;
}

/**
 * Cuánto hacia atrás se buscan eventos ya creados para detectar repetidos.
 *
 * Un año cubre de sobra el caso real —se cargan actividades del ciclo en curso—
 * y mantiene la consulta acotada en lugar de traerse el historial completo.
 */
const DIAS_HACIA_ATRAS = 365;

export class RepositorioImportacionEventosPrisma implements RepositorioImportacionEventos {
  private readonly eventos: RepositorioEventosPrisma;

  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {
    // La creación es la misma que la del formulario del panel, con sus
    // organizadores y su estado de borrador: se reutiliza en lugar de repetirla.
    this.eventos = new RepositorioEventosPrisma(prisma);
  }

  async catalogos(): Promise<CatalogosEventos> {
    const [categorias, asociaciones, clubes] = await Promise.all([
      this.prisma.categoriaEvento.findMany({
        where: { activo: true },
        select: { idCategoriaEvento: true, nombre: true },
      }),
      this.prisma.asociacion.findMany({
        where: { activo: true },
        select: { idAsociacion: true, nombre: true, siglas: true },
      }),
      this.prisma.club.findMany({
        where: { activo: true },
        select: { idClub: true, nombre: true },
      }),
    ]);

    const porAsociacion = new Map<string, number>();
    for (const asociacion of asociaciones) {
      // Se busca por nombre completo o por siglas: en la hoja se escribe
      // "AEBIO" mucho antes que el nombre oficial entero.
      porAsociacion.set(normalizarTexto(asociacion.nombre), asociacion.idAsociacion);
      if (asociacion.siglas) {
        porAsociacion.set(normalizarTexto(asociacion.siglas), asociacion.idAsociacion);
      }
    }

    return {
      categorias: new Map(
        categorias.map((categoria) => [
          normalizarTexto(categoria.nombre),
          categoria.idCategoriaEvento,
        ])
      ),
      nombresCategorias: categorias.map((categoria) => categoria.nombre),
      asociaciones: porAsociacion,
      clubes: new Map(clubes.map((club) => [normalizarTexto(club.nombre), club.idClub])),
    };
  }

  async listas(): Promise<ListasPlantilla> {
    const [categorias, asociaciones, clubes] = await Promise.all([
      this.prisma.categoriaEvento.findMany({
        where: { activo: true },
        select: { nombre: true },
        orderBy: { nombre: "asc" },
      }),
      this.prisma.asociacion.findMany({
        where: { activo: true },
        select: { nombre: true, siglas: true },
        orderBy: { nombre: "asc" },
      }),
      this.prisma.club.findMany({
        where: { activo: true },
        select: { nombre: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    return {
      categorias: categorias.map((categoria) => categoria.nombre),
      organizadores: [
        ...asociaciones.map((asociacion) => asociacion.siglas ?? asociacion.nombre),
        ...clubes.map((club) => club.nombre),
      ],
    };
  }

  async clavesExistentes(): Promise<string[]> {
    const desde = new Date(Date.now() - DIAS_HACIA_ATRAS * 24 * 60 * 60 * 1000);

    const eventos = await this.prisma.evento.findMany({
      where: { fechaInicio: { gte: desde } },
      select: { nombre: true, fechaInicio: true },
    });

    return eventos.map((evento) => claveDeEvento(evento.nombre, evento.fechaInicio));
  }

  async crear(
    datos: DatosEventoPersistidos,
    organizadores: OrganizadorNuevo[],
    creadoPor: number
  ): Promise<number> {
    return this.eventos.crear(datos, organizadores, creadoPor);
  }
}
