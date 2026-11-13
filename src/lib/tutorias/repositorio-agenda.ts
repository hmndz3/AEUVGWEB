import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";
import { aHoraDeReloj } from "@/lib/tutorias/formato-tutorias";
import type {
  DatosNuevaTutoria,
  RepositorioAgenda,
  TutoriaOcupada,
  TutoriaParaResolver,
  TutorParaAgenda,
} from "@/lib/tutorias/servicio-agenda";

export class RepositorioAgendaPrisma implements RepositorioAgenda {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

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

  async tutorParaAgenda(idTutor: number): Promise<TutorParaAgenda | null> {
    const tutor = await this.prisma.tutor.findUnique({
      where: { idTutor },
      select: {
        idTutor: true,
        idEstudiante: true,
        estado: true,
        cursos: { where: { activo: true }, select: { idCurso: true } },
        disponibilidades: {
          where: { activo: true },
          select: {
            diaSemana: true,
            horaInicio: true,
            horaFin: true,
            modalidad: true,
            ubicacionEnlace: true,
          },
        },
      },
    });

    if (!tutor) return null;

    return {
      idTutor: tutor.idTutor,
      idEstudiante: tutor.idEstudiante,
      estado: tutor.estado,
      cursos: tutor.cursos.map(({ idCurso }) => idCurso),
      franjas: tutor.disponibilidades.map((franja) => ({
        diaSemana: franja.diaSemana,
        horaInicio: aHoraDeReloj(franja.horaInicio),
        horaFin: aHoraDeReloj(franja.horaFin),
        modalidad: franja.modalidad,
        ubicacionEnlace: franja.ubicacionEnlace,
      })),
    };
  }

  /**
   * Solo se traen las tutorías que podrían chocar con la pedida: las del mismo
   * tramo. Traer la agenda completa del tutor para comparar una hora sería
   * cargar meses de historial en cada solicitud.
   */
  async tutoriasProgramadasDe(
    idTutor: number,
    desde: Date,
    hasta: Date
  ): Promise<TutoriaOcupada[]> {
    const tutorias = await this.prisma.tutoria.findMany({
      where: {
        idTutor,
        estado: "PROGRAMADA",
        fechaInicio: { lt: hasta },
        fechaFin: { gt: desde },
      },
      select: { fechaInicio: true, fechaFin: true },
    });

    return tutorias.map((tutoria) => ({ inicio: tutoria.fechaInicio, fin: tutoria.fechaFin }));
  }

  async crearTutoria(datos: DatosNuevaTutoria): Promise<number> {
    const tutoria = await this.prisma.tutoria.create({
      data: {
        idTutor: datos.idTutor,
        idCurso: datos.idCurso,
        idEstudiante: datos.idEstudiante,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        modalidad: datos.modalidad,
        ubicacionEnlace: datos.ubicacionEnlace,
        observaciones: datos.observaciones,
      },
      select: { idTutoria: true },
    });

    return tutoria.idTutoria;
  }

  async tutoriaPorId(idTutoria: number): Promise<TutoriaParaResolver | null> {
    return this.prisma.tutoria.findUnique({
      where: { idTutoria },
      select: { idTutoria: true, idTutor: true, idEstudiante: true, estado: true },
    });
  }

  async cambiarEstadoTutoria(
    idTutoria: number,
    estado: "COMPLETADA" | "CANCELADA"
  ): Promise<boolean> {
    const { count } = await this.prisma.tutoria.updateMany({
      where: { idTutoria, estado: "PROGRAMADA" },
      data: { estado },
    });

    return count > 0;
  }
}
