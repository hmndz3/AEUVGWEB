import type { PrismaClient } from "@prisma/client";

import { aHoraDeBase } from "@/lib/horas-beca/horario-oportunidad";
import { obtenerPrisma } from "@/lib/prisma";
import type { EstadoOportunidadFiltro } from "@/validators/oportunidad-admin";

/** Convocatoria tal como se escribe en la base, con las horas ya convertidas. */
export type DatosOportunidadPersistidos = {
  nombre: string;
  descripcion: string;
  fecha: Date;
  horaInicio: Date;
  horaFin: Date;
  lugar: string;
  cantidadPersonas: number;
  informacionAdicional: string | null;
};

/** Lo que el servicio necesita saber de una convocatoria antes de tocarla. */
export type EstadoActualOportunidad = {
  estado: EstadoOportunidadFiltro;
  /** Registros de horas ya asociados: con horas, la convocatoria no se elimina. */
  registros: number;
};

export interface RepositorioOportunidades {
  estadoActual(id: number): Promise<EstadoActualOportunidad | null>;
  crear(datos: DatosOportunidadPersistidos, creadoPor: number): Promise<number>;
  actualizar(id: number, datos: DatosOportunidadPersistidos): Promise<boolean>;
  cambiarEstado(id: number, estado: EstadoOportunidadFiltro): Promise<boolean>;
  eliminar(id: number): Promise<boolean>;
}

/** Convierte las horas de reloj del formulario a lo que espera la columna `time`. */
export function aDatosPersistidos(datos: {
  nombre: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  cantidadPersonas: number;
  informacionAdicional: string | null;
}): DatosOportunidadPersistidos {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    // La fecha es un día de calendario, igual que la de la actividad de un
    // registro de horas: se guarda como la medianoche en UTC.
    fecha: new Date(`${datos.fecha}T00:00:00.000Z`),
    horaInicio: aHoraDeBase(datos.horaInicio),
    horaFin: aHoraDeBase(datos.horaFin),
    lugar: datos.lugar,
    cantidadPersonas: datos.cantidadPersonas,
    informacionAdicional: datos.informacionAdicional,
  };
}

export class RepositorioOportunidadesPrisma implements RepositorioOportunidades {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async estadoActual(id: number): Promise<EstadoActualOportunidad | null> {
    const fila = await this.prisma.oportunidadHoraBeca.findUnique({
      where: { idOportunidad: id },
      select: { estado: true, _count: { select: { registrosHoraBeca: true } } },
    });

    return fila ? { estado: fila.estado, registros: fila._count.registrosHoraBeca } : null;
  }

  async crear(datos: DatosOportunidadPersistidos, creadoPor: number): Promise<number> {
    const creada = await this.prisma.oportunidadHoraBeca.create({
      // El estado no se indica: la columna nace como BORRADOR por omisión.
      data: { ...datos, creadoPor },
      select: { idOportunidad: true },
    });

    return creada.idOportunidad;
  }

  async actualizar(id: number, datos: DatosOportunidadPersistidos): Promise<boolean> {
    const { count } = await this.prisma.oportunidadHoraBeca.updateMany({
      where: { idOportunidad: id },
      data: datos,
    });

    return count > 0;
  }

  async cambiarEstado(id: number, estado: EstadoOportunidadFiltro): Promise<boolean> {
    const { count } = await this.prisma.oportunidadHoraBeca.updateMany({
      where: { idOportunidad: id },
      data: { estado },
    });

    return count > 0;
  }

  async eliminar(id: number): Promise<boolean> {
    const { count } = await this.prisma.oportunidadHoraBeca.deleteMany({
      where: { idOportunidad: id },
    });

    return count > 0;
  }
}
