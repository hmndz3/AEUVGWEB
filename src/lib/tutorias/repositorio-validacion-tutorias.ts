import { textoDeBusquedaRegistroHora } from "@/lib/horas-beca/busqueda-horas";
import { obtenerPrisma } from "@/lib/prisma";
import {
  horasDeTutoria,
  type PruebasDelTutor,
  type RepositorioValidacionTutorias,
  type TutoriaParaValidar,
} from "@/lib/tutorias/servicio-validacion-tutorias";
import { Prisma, type PrismaClient } from "@prisma/client";

const CAMPOS = {
  idTutoria: true,
  idTutor: true,
  idEstudiante: true,
  estado: true,
  estadoHoras: true,
  fechaInicio: true,
  fechaFin: true,
  pruebaEstudianteUrl: true,
} as const;

const diaGuatemala = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Guatemala",
});

const horaGuatemala = new Intl.DateTimeFormat("es-GT", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Guatemala",
});

/**
 * Día de calendario de la tutoría, guardado como medianoche en UTC.
 *
 * Es el mismo criterio que el resto de las horas beca: la fecha de la
 * actividad es un día del calendario y no un instante, así que una tutoría de
 * las siete de la noche no se corre al día siguiente.
 */
function diaDeLaActividad(fecha: Date): Date {
  return new Date(`${diaGuatemala.format(fecha)}T00:00:00.000Z`);
}

export class RepositorioValidacionTutoriasPrisma implements RepositorioValidacionTutorias {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async tutoriaPorId(idTutoria: number): Promise<TutoriaParaValidar | null> {
    return this.prisma.tutoria.findUnique({ where: { idTutoria }, select: CAMPOS });
  }

  async estudianteDeUsuario(idUsuario: number): Promise<number | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: { idEstudiante: true },
    });

    return usuario?.idEstudiante ?? null;
  }

  async tutorDeUsuario(idUsuario: number): Promise<number | null> {
    const tutor = await this.prisma.tutor.findFirst({
      where: { estudiante: { usuario: { idUsuario } } },
      select: { idTutor: true },
    });

    return tutor?.idTutor ?? null;
  }

  async responder(
    idTutoria: number,
    estado: "ACEPTADA" | "RECHAZADA",
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    // La condición del estado va en el where y no solo en el servicio: así dos
    // pulsaciones seguidas no aplican la respuesta dos veces.
    const { count } = await this.prisma.tutoria.updateMany({
      where: { idTutoria, estado: "PROGRAMADA" },
      data: { estado, comentarioTutor: comentario, fechaRespuestaTutor: ahora },
    });

    return count > 0;
  }

  async marcarPorTutor(idTutoria: number, pruebas: PruebasDelTutor, ahora: Date): Promise<boolean> {
    const { count } = await this.prisma.tutoria.updateMany({
      where: { idTutoria, estado: "ACEPTADA", estadoHoras: { in: ["SIN_ENVIAR", "RECHAZADAS"] } },
      data: {
        pruebaInicioUrl: pruebas.pruebaInicioUrl,
        pruebaFinUrl: pruebas.pruebaFinUrl,
        fechaMarcaTutor: ahora,
        estadoHoras: "PENDIENTE",
        // Un segundo envío después de un rechazo empieza de cero: el
        // comentario anterior ya no describe lo que AEUVG tiene delante.
        comentarioRevisionHoras: null,
      },
    });

    return count > 0;
  }

  async marcarPorEstudiante(idTutoria: number, pruebaUrl: string, ahora: Date): Promise<boolean> {
    const { count } = await this.prisma.tutoria.updateMany({
      where: { idTutoria, pruebaEstudianteUrl: null },
      data: { pruebaEstudianteUrl: pruebaUrl, fechaMarcaEstudiante: ahora },
    });

    return count > 0;
  }

  /**
   * Acepta las horas y las deja pendientes de acreditar a nombre del tutor.
   *
   * Va en una transacción porque son dos escrituras que no pueden quedar a
   * medias: un registro de horas sin tutoría cerrada se volvería a acreditar en
   * la siguiente revisión, y una tutoría cerrada sin registro dejaría al tutor
   * sin sus horas.
   */
  async aceptarHoras(
    idTutoria: number,
    idUsuarioRevisor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const tutoria = await this.prisma.tutoria.findUnique({
      where: { idTutoria },
      select: {
        estadoHoras: true,
        fechaInicio: true,
        fechaFin: true,
        curso: { select: { nombre: true } },
        estudiante: { select: { nombreCompleto: true } },
        tutor: {
          select: {
            idEstudiante: true,
            estudiante: { select: { carnet: true, nombreCompleto: true } },
          },
        },
      },
    });

    if (!tutoria || tutoria.estadoHoras !== "PENDIENTE") return false;

    const registro = {
      carnet: tutoria.tutor.estudiante.carnet,
      nombreEstudiante: tutoria.tutor.estudiante.nombreCompleto,
      descripcionActividad: `Tutoría de ${tutoria.curso.nombre} a ${tutoria.estudiante.nombreCompleto}`,
    };

    const horas = horasDeTutoria(tutoria.fechaInicio, tutoria.fechaFin);

    await this.prisma.$transaction(async (tx) => {
      const creado = await tx.registroHoraBeca.create({
        data: {
          ...registro,
          idEstudiante: tutoria.tutor.idEstudiante,
          creadoPor: idUsuarioRevisor,
          fechaActividad: diaDeLaActividad(tutoria.fechaInicio),
          horarioApoyo: `${horaGuatemala.format(tutoria.fechaInicio)} a ${horaGuatemala.format(tutoria.fechaFin)}`,
          cantidadHoras: new Prisma.Decimal(horas.toFixed(2)),
          observaciones: comentario,
          textoBusqueda: textoDeBusquedaRegistroHora(registro),
        },
        select: { idRegistroHora: true },
      });

      await tx.tutoria.update({
        where: { idTutoria },
        data: {
          estado: "COMPLETADA",
          estadoHoras: "ACEPTADAS",
          horasRevisadasPor: idUsuarioRevisor,
          fechaRevisionHoras: ahora,
          comentarioRevisionHoras: comentario,
          idRegistroHora: creado.idRegistroHora,
        },
      });
    });

    return true;
  }

  async rechazarHoras(
    idTutoria: number,
    idUsuarioRevisor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean> {
    const { count } = await this.prisma.tutoria.updateMany({
      where: { idTutoria, estadoHoras: "PENDIENTE" },
      data: {
        estadoHoras: "RECHAZADAS",
        horasRevisadasPor: idUsuarioRevisor,
        fechaRevisionHoras: ahora,
        comentarioRevisionHoras: comentario,
      },
    });

    return count > 0;
  }
}
