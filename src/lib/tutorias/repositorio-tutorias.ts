import { randomBytes } from "node:crypto";

import { Prisma, type EstadoTutor, type PrismaClient } from "@prisma/client";

import { ROLES } from "@/lib/auth/roles";
import { obtenerPrisma } from "@/lib/prisma";
import type { DatosCursoPostulacion } from "@/validators/tutoria";

/** Un curso ya resuelto a su identificador, listo para guardarse en la postulación. */
export type CursoNuevaPostulacion = Pick<
  DatosCursoPostulacion,
  "notaObtenida" | "comprobanteUrl"
> & { idCurso: number };

/** Lo que escribe el estudiante con la opción "Otro" de la postulación. */
export type CursoPropuesto = { nombre: string; codigo: string | null };

export type EstudianteDeSesion = { idEstudiante: number; nombreCompleto: string };

/** Lo que el servicio necesita saber de una postulación antes de resolverla. */
export type PostulacionResumida = {
  idPostulacion: number;
  idEstudiante: number;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  cursos: number[];
};

export type DatosNuevaPostulacion = {
  idEstudiante: number;
  comentarioSolicitante: string | null;
  cursos: CursoNuevaPostulacion[];
};

export interface RepositorioTutorias {
  estudianteDeUsuario(idUsuario: number): Promise<EstudianteDeSesion | null>;
  /** True si el estudiante tiene una postulación sin resolver. */
  tienePostulacionPendiente(idEstudiante: number): Promise<boolean>;
  esTutor(idEstudiante: number): Promise<boolean>;
  /** De los cursos pedidos, los que existen y están activos. */
  cursosActivos(ids: readonly number[]): Promise<number[]>;
  /**
   * El curso que corresponde a lo escrito con "Otro": el que ya existe con ese
   * código o ese nombre, o uno nuevo, inactivo y marcado como propuesto.
   */
  resolverCursoPropuesto(curso: CursoPropuesto): Promise<number>;
  crearPostulacion(datos: DatosNuevaPostulacion): Promise<number>;
  postulacionPorId(idPostulacion: number): Promise<PostulacionResumida | null>;
  /** Aprueba, da de alta al tutor con sus cursos y le concede el rol. */
  aprobarPostulacion(
    idPostulacion: number,
    idEstudiante: number,
    cursos: readonly number[],
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<number>;
  rechazarPostulacion(
    idPostulacion: number,
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
  /** Cambia el estado del tutor y desactiva su ficha cuando deja de estar activo. */
  cambiarEstadoTutor(idTutor: number, estado: EstadoTutor): Promise<boolean>;
}

export class RepositorioTutoriasPrisma implements RepositorioTutorias {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async estudianteDeUsuario(idUsuario: number): Promise<EstudianteDeSesion | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { estudiante: { select: { idEstudiante: true, nombreCompleto: true } } },
    });

    return usuario?.estudiante ?? null;
  }

  async tienePostulacionPendiente(idEstudiante: number): Promise<boolean> {
    const cuantas = await this.prisma.postulacionTutor.count({
      where: { idEstudiante, estado: "PENDIENTE" },
    });

    return cuantas > 0;
  }

  async esTutor(idEstudiante: number): Promise<boolean> {
    const cuantos = await this.prisma.tutor.count({ where: { idEstudiante } });

    return cuantos > 0;
  }

  async cursosActivos(ids: readonly number[]): Promise<number[]> {
    if (ids.length === 0) return [];

    const cursos = await this.prisma.curso.findMany({
      where: { idCurso: { in: [...ids] }, activo: true },
      select: { idCurso: true },
    });

    return cursos.map(({ idCurso }) => idCurso);
  }

  async resolverCursoPropuesto(curso: CursoPropuesto): Promise<number> {
    // Antes de crear uno se busca el que ya exista: lo más probable es que el
    // mismo curso lo hayan propuesto antes, o que esté en el catálogo con otro
    // nombre corto y el estudiante sí conozca el código.
    const existente = await this.prisma.curso.findFirst({
      where: {
        OR: [
          ...(curso.codigo
            ? [{ codigo: { equals: curso.codigo, mode: "insensitive" as const } }]
            : []),
          { nombre: { equals: curso.nombre, mode: "insensitive" } },
        ],
      },
      orderBy: [{ activo: "desc" }, { idCurso: "asc" }],
      select: { idCurso: true },
    });

    if (existente) return existente.idCurso;

    // Sin código conocido se genera uno provisional; AEUVG lo corrige desde el
    // panel de cursos antes o después de aprobar la postulación.
    const codigo = curso.codigo ?? `OTRO-${randomBytes(3).toString("hex").toUpperCase()}`;
    const creado = await this.prisma.curso.create({
      data: { codigo, nombre: curso.nombre, activo: false, propuesto: true },
      select: { idCurso: true },
    });

    return creado.idCurso;
  }

  /** La postulación y sus cursos se escriben juntos o no se escribe nada. */
  async crearPostulacion(datos: DatosNuevaPostulacion): Promise<number> {
    const postulacion = await this.prisma.postulacionTutor.create({
      data: {
        idEstudiante: datos.idEstudiante,
        comentarioSolicitante: datos.comentarioSolicitante,
        cursos: {
          create: datos.cursos.map((curso) => ({
            idCurso: curso.idCurso,
            notaObtenida: new Prisma.Decimal(curso.notaObtenida.toFixed(2)),
            comprobanteUrl: curso.comprobanteUrl,
          })),
        },
      },
      select: { idPostulacion: true },
    });

    return postulacion.idPostulacion;
  }

  async postulacionPorId(idPostulacion: number): Promise<PostulacionResumida | null> {
    const fila = await this.prisma.postulacionTutor.findUnique({
      where: { idPostulacion },
      select: {
        idPostulacion: true,
        idEstudiante: true,
        estado: true,
        cursos: { select: { idCurso: true } },
      },
    });

    return fila ? { ...fila, cursos: fila.cursos.map(({ idCurso }) => idCurso) } : null;
  }

  /**
   * Aprobar una postulación son cinco escrituras que van juntas: la
   * postulación cambia de estado, entran al catálogo los cursos propuestos,
   * nace o se reactiva el tutor, se le asignan sus cursos y se le concede el
   * rol. A medias dejaría a alguien aprobado sin
   * poder entrar a su propia sección, así que van en una transacción.
   */
  async aprobarPostulacion(
    idPostulacion: number,
    idEstudiante: number,
    cursos: readonly number[],
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      await tx.postulacionTutor.update({
        where: { idPostulacion },
        data: {
          estado: "APROBADA",
          revisadaPor,
          comentarioRevision: comentario,
          fechaRevision: ahora,
        },
      });

      // Una segunda aprobación reactiva al mismo tutor en lugar de duplicarlo:
      // la tabla tiene el estudiante como único.
      const tutor = await tx.tutor.upsert({
        where: { idEstudiante },
        create: { idEstudiante, estado: "ACTIVO", fechaAprobacion: ahora },
        update: { estado: "ACTIVO" },
        select: { idTutor: true },
      });

      // Los cursos que el estudiante propuso con "Otro" entran al catálogo al
      // aprobar: AEUVG ya los revisó junto con la nota que los respalda.
      await tx.curso.updateMany({
        where: { idCurso: { in: [...cursos] }, propuesto: true },
        data: { activo: true, propuesto: false },
      });

      for (const idCurso of cursos) {
        await tx.tutorCurso.upsert({
          where: { idTutor_idCurso: { idTutor: tutor.idTutor, idCurso } },
          create: { idTutor: tutor.idTutor, idCurso, activo: true },
          update: { activo: true },
        });
      }

      const rol = await tx.rol.findFirst({ where: { nombre: ROLES.tutor } });
      const usuario = await tx.usuario.findFirst({
        where: { idEstudiante },
        select: { idUsuario: true },
      });

      if (rol && usuario) {
        await tx.usuarioRol.upsert({
          where: { idUsuario_idRol: { idUsuario: usuario.idUsuario, idRol: rol.idRol } },
          create: { idUsuario: usuario.idUsuario, idRol: rol.idRol },
          update: {},
        });
      }

      return tutor.idTutor;
    });
  }

  /**
   * Un tutor suspendido o inactivo desaparece del directorio por su estado, no
   * por borrarse: sus tutorías ya realizadas siguen contando y su ficha tiene
   * que poder volver si AEUVG lo reactiva.
   */
  async cambiarEstadoTutor(idTutor: number, estado: EstadoTutor): Promise<boolean> {
    const { count } = await this.prisma.tutor.updateMany({
      where: { idTutor },
      data: { estado },
    });

    return count > 0;
  }

  async rechazarPostulacion(
    idPostulacion: number,
    revisadaPor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const { count } = await this.prisma.postulacionTutor.updateMany({
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
}
