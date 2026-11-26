import { type PrismaClient } from "@prisma/client";

import { ROLES } from "@/lib/auth/roles";
import { obtenerPrisma } from "@/lib/prisma";

export type EstudianteDeSesion = { idEstudiante: number; nombreCompleto: string };

/** Estado de un turno que el servicio necesita para decidir una postulación. */
export type InfoTurno = {
  idTurno: number;
  activo: boolean;
  cupo: number;
  asignadosActivos: number;
};

export type PostulacionResumida = {
  idPostulacion: number;
  idEstudiante: number;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  idsTurnos: number[];
};

export type DatosNuevaPostulacion = {
  idEstudiante: number;
  comentarioSolicitante: string | null;
  idsTurnos: number[];
};

/** Qué turnos se asignaron y cuáles quedaron fuera por estar llenos o inactivos. */
export type ResultadoAsignacion = { asignados: number[]; llenos: number[] };

export interface RepositorioVoluntarios {
  estudianteDeUsuario(idUsuario: number): Promise<EstudianteDeSesion | null>;
  tienePostulacionPendiente(idEstudiante: number): Promise<boolean>;
  infoTurnos(ids: readonly number[]): Promise<InfoTurno[]>;
  turnosAsignadosActivosDe(idEstudiante: number): Promise<number[]>;
  crearPostulacion(datos: DatosNuevaPostulacion): Promise<number>;
  postulacionPorId(idPostulacion: number): Promise<PostulacionResumida | null>;
  /** Asigna al estudiante a los turnos indicados (respetando el cupo) y le concede el rol. */
  aprobarPostulacion(
    idPostulacion: number,
    idEstudiante: number,
    idsTurnos: readonly number[],
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<ResultadoAsignacion>;
  rechazarPostulacion(
    idPostulacion: number,
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
  /** Da de baja una asignación y retira el rol si el estudiante se queda sin turnos. */
  desasignar(idAsignacion: number): Promise<boolean>;
}

export class RepositorioVoluntariosPrisma implements RepositorioVoluntarios {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async estudianteDeUsuario(idUsuario: number): Promise<EstudianteDeSesion | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { estudiante: { select: { idEstudiante: true, nombreCompleto: true } } },
    });

    return usuario?.estudiante ?? null;
  }

  async tienePostulacionPendiente(idEstudiante: number): Promise<boolean> {
    const cuantas = await this.prisma.postulacionVoluntario.count({
      where: { idEstudiante, estado: "PENDIENTE" },
    });

    return cuantas > 0;
  }

  async infoTurnos(ids: readonly number[]): Promise<InfoTurno[]> {
    if (ids.length === 0) return [];

    const turnos = await this.prisma.turnoVoluntariado.findMany({
      where: { idTurno: { in: [...ids] } },
      select: {
        idTurno: true,
        activo: true,
        cupo: true,
        _count: { select: { asignaciones: { where: { activo: true } } } },
      },
    });

    return turnos.map((turno) => ({
      idTurno: turno.idTurno,
      activo: turno.activo,
      cupo: turno.cupo,
      asignadosActivos: turno._count.asignaciones,
    }));
  }

  async turnosAsignadosActivosDe(idEstudiante: number): Promise<number[]> {
    const asignaciones = await this.prisma.asignacionVoluntario.findMany({
      where: { idEstudiante, activo: true },
      select: { idTurno: true },
    });

    return asignaciones.map(({ idTurno }) => idTurno);
  }

  async crearPostulacion(datos: DatosNuevaPostulacion): Promise<number> {
    const postulacion = await this.prisma.postulacionVoluntario.create({
      data: {
        idEstudiante: datos.idEstudiante,
        comentarioSolicitante: datos.comentarioSolicitante,
        turnos: { create: datos.idsTurnos.map((idTurno) => ({ idTurno })) },
      },
      select: { idPostulacion: true },
    });

    return postulacion.idPostulacion;
  }

  async postulacionPorId(idPostulacion: number): Promise<PostulacionResumida | null> {
    const fila = await this.prisma.postulacionVoluntario.findUnique({
      where: { idPostulacion },
      select: {
        idPostulacion: true,
        idEstudiante: true,
        estado: true,
        turnos: { select: { idTurno: true } },
      },
    });

    return fila ? { ...fila, idsTurnos: fila.turnos.map(({ idTurno }) => idTurno) } : null;
  }

  /**
   * Aprobar una postulación asigna al estudiante a los turnos elegidos sin pasar
   * del cupo, marca la postulación y le concede el rol de voluntario, todo en una
   * transacción: el cupo se cuenta dentro de ella para que dos revisiones
   * simultáneas no metan a tres personas en un turno de dos. Un turno que quedó
   * lleno entre la vista del panel y la aprobación se omite y se informa, en vez
   * de hacer fallar el resto.
   */
  async aprobarPostulacion(
    idPostulacion: number,
    idEstudiante: number,
    idsTurnos: readonly number[],
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<ResultadoAsignacion> {
    return this.prisma.$transaction(async (tx) => {
      const asignados: number[] = [];
      const llenos: number[] = [];

      for (const idTurno of idsTurnos) {
        const turno = await tx.turnoVoluntariado.findUnique({
          where: { idTurno },
          select: { cupo: true, activo: true },
        });
        if (!turno || !turno.activo) {
          llenos.push(idTurno);
          continue;
        }

        const existente = await tx.asignacionVoluntario.findUnique({
          where: { idTurno_idEstudiante: { idTurno, idEstudiante } },
          select: { activo: true },
        });
        if (existente?.activo) {
          asignados.push(idTurno);
          continue;
        }

        const activos = await tx.asignacionVoluntario.count({
          where: { idTurno, activo: true },
        });
        if (activos >= turno.cupo) {
          llenos.push(idTurno);
          continue;
        }

        await tx.asignacionVoluntario.upsert({
          where: { idTurno_idEstudiante: { idTurno, idEstudiante } },
          create: { idTurno, idEstudiante, asignadaPor: revisadaPor, activo: true },
          update: { activo: true, asignadaPor: revisadaPor, fechaAsignacion: ahora },
        });
        asignados.push(idTurno);
      }

      // Sin ningún turno asignable la postulación se deja pendiente: aprobarla
      // sin turnos dejaría a alguien "aprobado" pero sin nada que atender.
      if (asignados.length === 0) return { asignados, llenos };

      await tx.postulacionVoluntario.update({
        where: { idPostulacion },
        data: {
          estado: "APROBADA",
          revisadaPor,
          comentarioRevision: comentario,
          fechaRevision: ahora,
        },
      });

      await concederRolVoluntario(tx, idEstudiante);

      return { asignados, llenos };
    });
  }

  async rechazarPostulacion(
    idPostulacion: number,
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const { count } = await this.prisma.postulacionVoluntario.updateMany({
      where: { idPostulacion, estado: "PENDIENTE" },
      data: {
        estado: "RECHAZADA",
        revisadaPor,
        comentarioRevision: comentario,
        fechaRevision: ahora,
      },
    });

    return count > 0;
  }

  /**
   * Retirar a un voluntario de un turno es una baja lógica. Si con ella deja de
   * tener turnos activos, pierde el rol: la pestaña de voluntario solo tiene
   * sentido mientras atiende al menos un turno.
   */
  async desasignar(idAsignacion: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const asignacion = await tx.asignacionVoluntario.findUnique({
        where: { idAsignacion },
        select: { idEstudiante: true, activo: true },
      });
      if (!asignacion) return false;

      if (asignacion.activo) {
        await tx.asignacionVoluntario.update({
          where: { idAsignacion },
          data: { activo: false },
        });
      }

      const restantes = await tx.asignacionVoluntario.count({
        where: { idEstudiante: asignacion.idEstudiante, activo: true },
      });
      if (restantes === 0) await retirarRolVoluntario(tx, asignacion.idEstudiante);

      return true;
    });
  }
}

/** Cliente de transacción de Prisma, para las ayudas de rol compartidas. */
type ClienteTx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function concederRolVoluntario(tx: ClienteTx, idEstudiante: number): Promise<void> {
  const rol = await tx.rol.findFirst({ where: { nombre: ROLES.voluntario } });
  const usuario = await tx.usuario.findFirst({
    where: { idEstudiante },
    select: { idUsuario: true },
  });

  if (rol && usuario) {
    await tx.usuarioRol.upsert({
      where: { idUsuario_idRol: { idUsuario: usuario.idUsuario, idRol: rol.idRol } },
      create: { idUsuario: usuario.idUsuario, idRol: rol.idRol },
      update: { activo: true },
    });
  }
}

async function retirarRolVoluntario(tx: ClienteTx, idEstudiante: number): Promise<void> {
  const rol = await tx.rol.findFirst({ where: { nombre: ROLES.voluntario } });
  const usuario = await tx.usuario.findFirst({
    where: { idEstudiante },
    select: { idUsuario: true },
  });

  if (rol && usuario) {
    await tx.usuarioRol.deleteMany({
      where: { idUsuario: usuario.idUsuario, idRol: rol.idRol },
    });
  }
}
