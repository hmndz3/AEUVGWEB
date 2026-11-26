import { type DiaSemana, type PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

/** Un voluntario asignado a un turno, con lo que se muestra de él. */
export type VoluntarioAsignado = {
  idAsignacion: number;
  idEstudiante: number;
  nombreCompleto: string;
  carnet: string;
};

export type TurnoConAsignados = {
  idTurno: number;
  diaSemana: DiaSemana;
  horaInicio: Date;
  horaFin: Date;
  cupo: number;
  activo: boolean;
  asignados: VoluntarioAsignado[];
};

export type DatosTurnoPersistido = {
  diaSemana: DiaSemana;
  horaInicio: Date;
  horaFin: Date;
  activo: boolean;
};

export type ResultadoEliminacionTurno =
  { tipo: "eliminado" } | { tipo: "con_dependencias" } | { tipo: "no_encontrado" };

export interface RepositorioTurnos {
  listar(soloActivos?: boolean): Promise<TurnoConAsignados[]>;
  turnoPorId(idTurno: number): Promise<DatosTurnoPersistido | null>;
  existeTurno(
    diaSemana: DiaSemana,
    horaInicio: Date,
    horaFin: Date,
    exceptoId?: number
  ): Promise<boolean>;
  crear(datos: DatosTurnoPersistido): Promise<number>;
  actualizar(idTurno: number, datos: DatosTurnoPersistido): Promise<boolean>;
  eliminar(idTurno: number): Promise<ResultadoEliminacionTurno>;
}

export class RepositorioTurnosPrisma implements RepositorioTurnos {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async listar(soloActivos = false): Promise<TurnoConAsignados[]> {
    const turnos = await this.prisma.turnoVoluntariado.findMany({
      where: soloActivos ? { activo: true } : {},
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      select: {
        idTurno: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
        cupo: true,
        activo: true,
        asignaciones: {
          where: { activo: true },
          orderBy: { fechaAsignacion: "asc" },
          select: {
            idAsignacion: true,
            estudiante: { select: { idEstudiante: true, nombreCompleto: true, carnet: true } },
          },
        },
      },
    });

    return turnos.map((turno) => ({
      idTurno: turno.idTurno,
      diaSemana: turno.diaSemana,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      cupo: turno.cupo,
      activo: turno.activo,
      asignados: turno.asignaciones.map((asignacion) => ({
        idAsignacion: asignacion.idAsignacion,
        idEstudiante: asignacion.estudiante.idEstudiante,
        nombreCompleto: asignacion.estudiante.nombreCompleto,
        carnet: asignacion.estudiante.carnet,
      })),
    }));
  }

  async turnoPorId(idTurno: number): Promise<DatosTurnoPersistido | null> {
    return this.prisma.turnoVoluntariado.findUnique({
      where: { idTurno },
      select: { diaSemana: true, horaInicio: true, horaFin: true, activo: true },
    });
  }

  async existeTurno(
    diaSemana: DiaSemana,
    horaInicio: Date,
    horaFin: Date,
    exceptoId?: number
  ): Promise<boolean> {
    const cuantos = await this.prisma.turnoVoluntariado.count({
      where: {
        diaSemana,
        horaInicio,
        horaFin,
        ...(exceptoId ? { idTurno: { not: exceptoId } } : {}),
      },
    });

    return cuantos > 0;
  }

  async crear(datos: DatosTurnoPersistido): Promise<number> {
    const creado = await this.prisma.turnoVoluntariado.create({
      data: datos,
      select: { idTurno: true },
    });

    return creado.idTurno;
  }

  async actualizar(idTurno: number, datos: DatosTurnoPersistido): Promise<boolean> {
    const { count } = await this.prisma.turnoVoluntariado.updateMany({
      where: { idTurno },
      data: datos,
    });

    return count > 0;
  }

  /**
   * Un turno con comprobantes de horas ya enviados no se borra: esas horas son
   * de un voluntario y la referencia al turno es parte de su registro. El panel
   * lo desactiva, con lo que deja de aceptar postulaciones y de mostrarse.
   */
  async eliminar(idTurno: number): Promise<ResultadoEliminacionTurno> {
    const conComprobantes = await this.prisma.comprobanteTurno.count({ where: { idTurno } });
    if (conComprobantes > 0) return { tipo: "con_dependencias" };

    const { count } = await this.prisma.turnoVoluntariado.deleteMany({ where: { idTurno } });

    return count > 0 ? { tipo: "eliminado" } : { tipo: "no_encontrado" };
  }
}
