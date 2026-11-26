import { type DiaSemana, type PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";

export type VoluntarioDeSesion = {
  idEstudiante: number;
  nombreCompleto: string;
  carnet: string;
};

/** Horario de un turno al que el estudiante está asignado. */
export type TurnoAsignado = {
  diaSemana: DiaSemana;
  horaInicio: Date;
  horaFin: Date;
};

export type DatosComprobantePersistido = {
  idTurno: number;
  fecha: Date;
  horaEntrada: Date;
  horaSalida: Date;
  fotoInicioUrl: string;
  fotoFinUrl: string;
  comentarioVoluntario: string | null;
};

/** Lo que el servicio necesita de un comprobante para revisarlo y acreditarlo. */
export type ComprobanteParaRevision = {
  idComprobante: number;
  idEstudiante: number;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  fecha: Date;
  turno: { diaSemana: DiaSemana; horaInicio: Date; horaFin: Date };
  estudiante: { carnet: string; nombreCompleto: string };
};

export interface RepositorioComprobantes {
  voluntarioDeSesion(idUsuario: number): Promise<VoluntarioDeSesion | null>;
  /** El turno si el estudiante está asignado a él y activo; null en otro caso. */
  turnoAsignado(idEstudiante: number, idTurno: number): Promise<TurnoAsignado | null>;
  crearComprobante(datos: DatosComprobantePersistido, idEstudiante: number): Promise<number>;
  comprobantePorId(idComprobante: number): Promise<ComprobanteParaRevision | null>;
  /** Aprueba el comprobante y lo liga a su registro de horas; false si ya no estaba pendiente. */
  aprobar(
    idComprobante: number,
    idRegistroHora: number,
    revisadoPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
  rechazar(
    idComprobante: number,
    revisadoPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
}

export class RepositorioComprobantesPrisma implements RepositorioComprobantes {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async voluntarioDeSesion(idUsuario: number): Promise<VoluntarioDeSesion | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        estudiante: { select: { idEstudiante: true, nombreCompleto: true, carnet: true } },
      },
    });

    return usuario?.estudiante ?? null;
  }

  async turnoAsignado(idEstudiante: number, idTurno: number): Promise<TurnoAsignado | null> {
    const asignacion = await this.prisma.asignacionVoluntario.findFirst({
      where: { idEstudiante, idTurno, activo: true },
      select: {
        turno: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
      },
    });

    return asignacion?.turno ?? null;
  }

  async crearComprobante(datos: DatosComprobantePersistido, idEstudiante: number): Promise<number> {
    const comprobante = await this.prisma.comprobanteTurno.create({
      data: { idEstudiante, ...datos },
      select: { idComprobante: true },
    });

    return comprobante.idComprobante;
  }

  async comprobantePorId(idComprobante: number): Promise<ComprobanteParaRevision | null> {
    const fila = await this.prisma.comprobanteTurno.findUnique({
      where: { idComprobante },
      select: {
        idComprobante: true,
        idEstudiante: true,
        estado: true,
        fecha: true,
        turno: { select: { diaSemana: true, horaInicio: true, horaFin: true } },
        estudiante: { select: { carnet: true, nombreCompleto: true } },
      },
    });

    return fila;
  }

  async aprobar(
    idComprobante: number,
    idRegistroHora: number,
    revisadoPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const { count } = await this.prisma.comprobanteTurno.updateMany({
      where: { idComprobante, estado: "PENDIENTE" },
      data: {
        estado: "APROBADO",
        idRegistroHora,
        revisadoPor,
        comentarioRevision: comentario,
        fechaRevision: ahora,
      },
    });

    return count > 0;
  }

  async rechazar(
    idComprobante: number,
    revisadoPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const { count } = await this.prisma.comprobanteTurno.updateMany({
      where: { idComprobante, estado: "PENDIENTE" },
      data: {
        estado: "RECHAZADO",
        revisadoPor,
        comentarioRevision: comentario,
        fechaRevision: ahora,
      },
    });

    return count > 0;
  }
}
