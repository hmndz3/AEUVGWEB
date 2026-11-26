import { type PrismaClient, type TallaBata, type TipoArticuloBata } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Un artículo con lo que hace falta para decidir si se puede prestar. */
export type ArticuloParaPrestamo = {
  idArticulo: number;
  tipo: TipoArticuloBata;
  talla: TallaBata | null;
  activo: boolean;
  cantidadTotal: number;
  cantidadPrestada: number;
};

export type DatosPrestamoPersistido = {
  nombre: string;
  apellido: string;
  carnet: string;
  correo: string | null;
  telefono: string | null;
  fechaPrestamo: Date;
  horaSalida: Date;
  horaEntregaEstimada: Date | null;
  comentarios: string | null;
  articulos: { idArticulo: number; cantidad: number }[];
};

export type DatosListaNegraPersistido = {
  fecha: Date | null;
  nombre: string;
  apellido: string | null;
  correo: string | null;
  carnet: string | null;
  telefono: string | null;
  justificacion: string;
};

export interface RepositorioOperacion {
  articulosParaPrestamo(ids: readonly number[]): Promise<ArticuloParaPrestamo[]>;
  crearPrestamo(datos: DatosPrestamoPersistido, registradoPor: number): Promise<number>;
  /** Marca un préstamo como devuelto; false si no existe o ya estaba devuelto. */
  marcarDevuelto(idPrestamo: number, nota: string | null, ahora: Date): Promise<boolean>;
  crearListaNegra(datos: DatosListaNegraPersistido, registradoPor: number): Promise<number>;
  /** True si el voluntario ya envió el comprobante de ese día. */
  turnoCerrado(registradoPor: number, dia: string): Promise<boolean>;
}

/** Nota del voluntario al devolver, sin perder lo que ya tenía el préstamo. */
function combinarComentarioDevolucion(previo: string | null, nota: string | null): string | null {
  if (!nota) return previo;
  return previo ? `${previo}\nDevolución: ${nota}` : `Devolución: ${nota}`;
}

export class RepositorioOperacionPrisma implements RepositorioOperacion {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async turnoCerrado(registradoPor: number, dia: string): Promise<boolean> {
    const cuantos = await this.prisma.comprobanteTurno.count({
      where: {
        fecha: new Date(`${dia}T00:00:00.000Z`),
        estudiante: { usuario: { idUsuario: registradoPor } },
      },
    });

    return cuantos > 0;
  }

  async articulosParaPrestamo(ids: readonly number[]): Promise<ArticuloParaPrestamo[]> {
    if (ids.length === 0) return [];

    const articulos = await this.prisma.articuloInventario.findMany({
      where: { idArticulo: { in: [...ids] } },
      select: { idArticulo: true, tipo: true, talla: true, activo: true, cantidadTotal: true },
    });

    const prestadas = await this.prisma.articuloPrestado.groupBy({
      by: ["idArticulo"],
      where: { idArticulo: { in: [...ids] }, prestamo: { estado: "PRESTADO" } },
      _sum: { cantidad: true },
    });
    const porArticulo = new Map(
      prestadas.map((fila) => [fila.idArticulo, fila._sum.cantidad ?? 0])
    );

    return articulos.map((articulo) => ({
      ...articulo,
      cantidadPrestada: porArticulo.get(articulo.idArticulo) ?? 0,
    }));
  }

  /** El préstamo y sus artículos se escriben juntos o no se escribe nada. */
  async crearPrestamo(datos: DatosPrestamoPersistido, registradoPor: number): Promise<number> {
    const prestamo = await this.prisma.prestamoBata.create({
      data: {
        registradoPor,
        nombre: datos.nombre,
        apellido: datos.apellido,
        carnet: datos.carnet,
        correo: datos.correo,
        telefono: datos.telefono,
        fechaPrestamo: datos.fechaPrestamo,
        horaSalida: datos.horaSalida,
        horaEntregaEstimada: datos.horaEntregaEstimada,
        comentarios: datos.comentarios,
        articulos: {
          create: datos.articulos.map((articulo) => ({
            idArticulo: articulo.idArticulo,
            cantidad: articulo.cantidad,
          })),
        },
      },
      select: { idPrestamo: true },
    });

    return prestamo.idPrestamo;
  }

  async marcarDevuelto(idPrestamo: number, nota: string | null, ahora: Date): Promise<boolean> {
    const prestamo = await this.prisma.prestamoBata.findUnique({
      where: { idPrestamo },
      select: { estado: true, comentarios: true },
    });
    if (!prestamo || prestamo.estado !== "PRESTADO") return false;

    await this.prisma.prestamoBata.update({
      where: { idPrestamo },
      data: {
        estado: "DEVUELTO",
        fechaDevolucion: ahora,
        comentarios: combinarComentarioDevolucion(prestamo.comentarios, nota),
      },
    });

    return true;
  }

  async crearListaNegra(datos: DatosListaNegraPersistido, registradoPor: number): Promise<number> {
    const entrada = await this.prisma.listaNegraBata.create({
      data: { registradoPor, ...datos },
      select: { idListaNegra: true },
    });

    return entrada.idListaNegra;
  }
}
