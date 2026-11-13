import type { PrismaClient } from "@prisma/client";

import { obtenerPrisma } from "@/lib/prisma";
import { aHoraDeBase } from "@/lib/tutorias/formato-tutorias";
import type { DatosDisponibilidad, DatosFichaTutor } from "@/validators/tutoria";

export interface RepositorioFichaTutor {
  /** El tutor que corresponde a la cuenta, o null si esa cuenta no lo es. */
  tutorDeUsuario(idUsuario: number): Promise<number | null>;
  actualizarFicha(idTutor: number, datos: DatosFichaTutor): Promise<boolean>;
  /** Franjas ya guardadas del tutor, para comprobar que una nueva no se encime. */
  franjasDe(
    idTutor: number
  ): Promise<
    { idDisponibilidad: number; diaSemana: string; horaInicio: string; horaFin: string }[]
  >;
  agregarFranja(idTutor: number, datos: DatosDisponibilidad): Promise<number>;
  quitarFranja(idTutor: number, idDisponibilidad: number): Promise<boolean>;
}

export class RepositorioFichaTutorPrisma implements RepositorioFichaTutor {
  constructor(private readonly prisma: PrismaClient = obtenerPrisma()) {}

  async tutorDeUsuario(idUsuario: number): Promise<number | null> {
    const tutor = await this.prisma.tutor.findFirst({
      where: { estudiante: { usuario: { idUsuario } } },
      select: { idTutor: true },
    });

    return tutor?.idTutor ?? null;
  }

  async actualizarFicha(idTutor: number, datos: DatosFichaTutor): Promise<boolean> {
    const { count } = await this.prisma.tutor.updateMany({
      where: { idTutor },
      data: { descripcion: datos.descripcion, informacionContacto: datos.informacionContacto },
    });

    return count > 0;
  }

  async franjasDe(idTutor: number) {
    const franjas = await this.prisma.disponibilidadTutor.findMany({
      where: { idTutor, activo: true },
      select: { idDisponibilidad: true, diaSemana: true, horaInicio: true, horaFin: true },
    });

    return franjas.map((franja) => ({
      idDisponibilidad: franja.idDisponibilidad,
      diaSemana: franja.diaSemana as string,
      horaInicio: franja.horaInicio.toISOString().slice(11, 16),
      horaFin: franja.horaFin.toISOString().slice(11, 16),
    }));
  }

  async agregarFranja(idTutor: number, datos: DatosDisponibilidad): Promise<number> {
    const franja = await this.prisma.disponibilidadTutor.create({
      data: {
        idTutor,
        diaSemana: datos.diaSemana,
        horaInicio: aHoraDeBase(datos.horaInicio),
        horaFin: aHoraDeBase(datos.horaFin),
        modalidad: datos.modalidad,
        ubicacionEnlace: datos.ubicacionEnlace,
      },
      select: { idDisponibilidad: true },
    });

    return franja.idDisponibilidad;
  }

  /**
   * La franja se borra de verdad y no se desactiva: a diferencia de un tutor,
   * no tiene historial que conservar. Las tutorías ya agendadas guardan su
   * propia fecha y hora, así que quitar la franja no las toca.
   */
  async quitarFranja(idTutor: number, idDisponibilidad: number): Promise<boolean> {
    const { count } = await this.prisma.disponibilidadTutor.deleteMany({
      where: { idDisponibilidad, idTutor },
    });

    return count > 0;
  }
}
