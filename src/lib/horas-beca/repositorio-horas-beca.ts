import { Prisma, type PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Cuenta a la que pertenece un carnet, cuando existe. */
export type EstudianteDeCarnet = {
  idEstudiante: number;
  nombreCompleto: string;
};

/** Registro de horas tal como se escribe en la base, ya resuelto por el servicio. */
export type DatosRegistroHoraPersistidos = {
  carnet: string;
  nombreEstudiante: string;
  idEstudiante: number | null;
  fechaActividad: Date;
  horarioApoyo: string;
  descripcionActividad: string;
  cantidadHoras: number;
  observaciones: string | null;
  textoBusqueda: string;
};

export interface RepositorioHorasBeca {
  /** Busca la cuenta del carnet indicado, que puede no existir todavía. */
  estudianteDeCarnet(carnet: string): Promise<EstudianteDeCarnet | null>;
  crear(datos: DatosRegistroHoraPersistidos, creadoPor: number): Promise<number>;
  actualizar(id: number, datos: DatosRegistroHoraPersistidos): Promise<boolean>;
  eliminar(id: number): Promise<boolean>;
  /** Acredita los registros pendientes indicados y devuelve cuántos cambiaron. */
  acreditar(ids: readonly number[], acreditadoPor: number, fecha: Date): Promise<number>;
}

/**
 * Las horas se guardan en `Decimal(6,2)`: sumar cientos de registros de media
 * hora con coma flotante arrastra error, y el total de horas de un estudiante no
 * admite aproximaciones. La conversión se hace al escribir, con dos decimales,
 * que es la precisión de la columna.
 */
function aDecimal(horas: number): Prisma.Decimal {
  return new Prisma.Decimal(horas.toFixed(2));
}

export class RepositorioHorasBecaPrisma implements RepositorioHorasBeca {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async estudianteDeCarnet(carnet: string): Promise<EstudianteDeCarnet | null> {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { carnet },
      select: { idEstudiante: true, nombreCompleto: true },
    });

    return estudiante ?? null;
  }

  async crear(datos: DatosRegistroHoraPersistidos, creadoPor: number): Promise<number> {
    const registro = await this.prisma.registroHoraBeca.create({
      data: {
        carnet: datos.carnet,
        nombreEstudiante: datos.nombreEstudiante,
        idEstudiante: datos.idEstudiante,
        creadoPor,
        fechaActividad: datos.fechaActividad,
        horarioApoyo: datos.horarioApoyo,
        descripcionActividad: datos.descripcionActividad,
        cantidadHoras: aDecimal(datos.cantidadHoras),
        observaciones: datos.observaciones,
        textoBusqueda: datos.textoBusqueda,
      },
      select: { idRegistroHora: true },
    });

    return registro.idRegistroHora;
  }

  /**
   * El estado, la fecha de acreditación y el responsable no se escriben aquí:
   * son de la acreditación, no del registro, y corregir una descripción no debe
   * poder devolver a pendiente lo que AEUVG ya acreditó.
   */
  async actualizar(id: number, datos: DatosRegistroHoraPersistidos): Promise<boolean> {
    const { count } = await this.prisma.registroHoraBeca.updateMany({
      where: { idRegistroHora: id },
      data: {
        carnet: datos.carnet,
        nombreEstudiante: datos.nombreEstudiante,
        idEstudiante: datos.idEstudiante,
        fechaActividad: datos.fechaActividad,
        horarioApoyo: datos.horarioApoyo,
        descripcionActividad: datos.descripcionActividad,
        cantidadHoras: aDecimal(datos.cantidadHoras),
        observaciones: datos.observaciones,
        textoBusqueda: datos.textoBusqueda,
      },
    });

    return count > 0;
  }

  async eliminar(id: number): Promise<boolean> {
    const { count } = await this.prisma.registroHoraBeca.deleteMany({
      where: { idRegistroHora: id },
    });

    return count > 0;
  }

  /**
   * La condición exige que el registro siga pendiente, no solo que exista: así
   * una acreditación repetida no reescribe la fecha ni el responsable de lo que
   * ya estaba acreditado, y el conteo que devuelve es el de los registros que
   * realmente cambiaron.
   */
  async acreditar(ids: readonly number[], acreditadoPor: number, fecha: Date): Promise<number> {
    const { count } = await this.prisma.registroHoraBeca.updateMany({
      where: { idRegistroHora: { in: [...ids] }, estado: "PENDIENTE" },
      data: { estado: "ACREDITADA", fechaAcreditacion: fecha, acreditadoPor },
    });

    return count;
  }
}
