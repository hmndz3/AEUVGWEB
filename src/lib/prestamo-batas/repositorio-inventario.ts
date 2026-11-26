import { type PrismaClient, type TallaBata, type TipoArticuloBata } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Un artículo del inventario con cuántos están prestados ahora mismo. */
export type ArticuloConDisponibilidad = {
  idArticulo: number;
  tipo: TipoArticuloBata;
  talla: TallaBata | null;
  cantidadTotal: number;
  cantidadPrestada: number;
  activo: boolean;
};

export type DatosArticuloPersistido = {
  tipo: TipoArticuloBata;
  talla: TallaBata | null;
  cantidadTotal: number;
  activo: boolean;
};

export type ResultadoEliminacionArticulo =
  { tipo: "eliminado" } | { tipo: "con_prestamos" } | { tipo: "no_encontrado" };

export interface RepositorioInventario {
  /** Todos los artículos, con lo prestado resuelto, ordenados para mostrarse. */
  listar(): Promise<ArticuloConDisponibilidad[]>;
  articuloPorId(idArticulo: number): Promise<DatosArticuloPersistido | null>;
  /** True si ya existe un artículo con ese tipo y talla, ignorando el indicado. */
  existeTipoTalla(
    tipo: TipoArticuloBata,
    talla: TallaBata | null,
    exceptoId?: number
  ): Promise<boolean>;
  /** Unidades de un artículo prestadas y sin devolver. */
  cantidadPrestadaDe(idArticulo: number): Promise<number>;
  crear(datos: DatosArticuloPersistido): Promise<number>;
  actualizar(idArticulo: number, datos: DatosArticuloPersistido): Promise<boolean>;
  eliminar(idArticulo: number): Promise<ResultadoEliminacionArticulo>;
}

/**
 * Lo prestado de cada artículo se calcula con una agregación aparte en lugar de
 * contar filas traídas a memoria: el inventario es pequeño, pero los préstamos
 * crecen con cada día de atención y no deben cargarse enteros solo para sumar.
 */
async function prestadasPorArticulo(
  prisma: PrismaClient,
  ids?: readonly number[]
): Promise<Map<number, number>> {
  const agregados = await prisma.articuloPrestado.groupBy({
    by: ["idArticulo"],
    where: {
      prestamo: { estado: "PRESTADO" },
      ...(ids ? { idArticulo: { in: [...ids] } } : {}),
    },
    _sum: { cantidad: true },
  });

  return new Map(agregados.map((fila) => [fila.idArticulo, fila._sum.cantidad ?? 0]));
}

export class RepositorioInventarioPrisma implements RepositorioInventario {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async listar(): Promise<ArticuloConDisponibilidad[]> {
    const articulos = await this.prisma.articuloInventario.findMany({
      orderBy: [{ tipo: "asc" }, { talla: "asc" }],
      select: { idArticulo: true, tipo: true, talla: true, cantidadTotal: true, activo: true },
    });

    const prestadas = await prestadasPorArticulo(this.prisma);

    return articulos.map((articulo) => ({
      ...articulo,
      cantidadPrestada: prestadas.get(articulo.idArticulo) ?? 0,
    }));
  }

  async articuloPorId(idArticulo: number): Promise<DatosArticuloPersistido | null> {
    return this.prisma.articuloInventario.findUnique({
      where: { idArticulo },
      select: { tipo: true, talla: true, cantidadTotal: true, activo: true },
    });
  }

  async existeTipoTalla(
    tipo: TipoArticuloBata,
    talla: TallaBata | null,
    exceptoId?: number
  ): Promise<boolean> {
    const cuantos = await this.prisma.articuloInventario.count({
      where: {
        tipo,
        talla,
        ...(exceptoId ? { idArticulo: { not: exceptoId } } : {}),
      },
    });

    return cuantos > 0;
  }

  async cantidadPrestadaDe(idArticulo: number): Promise<number> {
    const prestadas = await prestadasPorArticulo(this.prisma, [idArticulo]);

    return prestadas.get(idArticulo) ?? 0;
  }

  async crear(datos: DatosArticuloPersistido): Promise<number> {
    const creado = await this.prisma.articuloInventario.create({
      data: datos,
      select: { idArticulo: true },
    });

    return creado.idArticulo;
  }

  async actualizar(idArticulo: number, datos: DatosArticuloPersistido): Promise<boolean> {
    const { count } = await this.prisma.articuloInventario.updateMany({
      where: { idArticulo },
      data: datos,
    });

    return count > 0;
  }

  /**
   * Un artículo con préstamos registrados no se borra: aunque estén devueltos,
   * sus filas en `articulo_prestado` lo referencian y perder esa historia
   * descuadraría cualquier recuento pasado. En su lugar el panel lo desactiva.
   */
  async eliminar(idArticulo: number): Promise<ResultadoEliminacionArticulo> {
    const conPrestamos = await this.prisma.articuloPrestado.count({ where: { idArticulo } });
    if (conPrestamos > 0) return { tipo: "con_prestamos" };

    const { count } = await this.prisma.articuloInventario.deleteMany({ where: { idArticulo } });

    return count > 0 ? { tipo: "eliminado" } : { tipo: "no_encontrado" };
  }
}
