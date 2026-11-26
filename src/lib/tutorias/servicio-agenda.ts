import {
  franjaQueCubre,
  instanteEnGuatemala,
  modalidadCompatible,
  seTraslapan,
  type FranjaDisponible,
} from "@/lib/tutorias/agenda-tutorias";
import type { DatosSolicitudTutoria } from "@/validators/tutoria";

/** Lo que el servicio necesita saber del tutor al que se le solicita. */
export type TutorParaAgenda = {
  idTutor: number;
  idEstudiante: number;
  estado: string;
  cursos: number[];
  franjas: FranjaDisponible[];
};

export type TutoriaOcupada = { inicio: Date; fin: Date };

export type TutoriaParaResolver = {
  idTutoria: number;
  idTutor: number;
  idEstudiante: number;
  estado: string;
};

export type DatosNuevaTutoria = {
  idTutor: number;
  idCurso: number;
  idEstudiante: number;
  fechaInicio: Date;
  fechaFin: Date;
  modalidad: DatosSolicitudTutoria["modalidad"];
  ubicacionEnlace: string | null;
  observaciones: string | null;
};

export interface RepositorioAgenda {
  estudianteDeUsuario(idUsuario: number): Promise<number | null>;
  tutorParaAgenda(idTutor: number): Promise<TutorParaAgenda | null>;
  /** Tutorías programadas del tutor que podrían chocar con la pedida. */
  tutoriasProgramadasDe(idTutor: number, desde: Date, hasta: Date): Promise<TutoriaOcupada[]>;
  crearTutoria(datos: DatosNuevaTutoria): Promise<number>;
  tutoriaPorId(idTutoria: number): Promise<TutoriaParaResolver | null>;
  /** Devuelve el tutor que corresponde a la cuenta, para saber quién resuelve. */
  tutorDeUsuario(idUsuario: number): Promise<number | null>;
  /** Cancela la tutoría si todavía estaba en pie. */
  cancelarTutoria(idTutoria: number): Promise<boolean>;
}

export type ResultadoSolicitud =
  | { tipo: "solicitada"; idTutoria: number }
  | { tipo: "sin_estudiante" }
  | { tipo: "invalida"; mensaje: string };

export type ResultadoAccionTutoria =
  | { tipo: "aplicada"; estado: "CANCELADA" }
  | { tipo: "no_encontrada" }
  | { tipo: "no_permitida"; mensaje: string };

/**
 * Agenda de tutorías.
 *
 * La solicitud la hace el estudiante y queda programada de una vez, sin que el
 * tutor tenga que confirmarla: el tutor ya publicó en qué horarios puede, y
 * pedirle además que confirme cada cita convertiría su disponibilidad en una
 * intención y no en un compromiso. Lo que sí puede es cancelarla.
 *
 * Las reglas son las que impiden que una cita no se pueda cumplir: tiene que
 * caer dentro de una franja publicada, el tutor no puede tener dos a la misma
 * hora, la fecha no puede haber pasado y nadie se agenda consigo mismo.
 */
export class ServicioAgenda {
  constructor(
    private readonly repositorio: RepositorioAgenda,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async solicitar(idUsuario: number, datos: DatosSolicitudTutoria): Promise<ResultadoSolicitud> {
    const idEstudiante = await this.repositorio.estudianteDeUsuario(idUsuario);
    if (idEstudiante === null) return { tipo: "sin_estudiante" };

    const tutor = await this.repositorio.tutorParaAgenda(datos.idTutor);
    if (!tutor || tutor.estado !== "ACTIVO") {
      return { tipo: "invalida", mensaje: "Ese tutor ya no está disponible." };
    }
    if (tutor.idEstudiante === idEstudiante) {
      return { tipo: "invalida", mensaje: "No puedes agendarte una tutoría contigo mismo." };
    }
    if (!tutor.cursos.includes(datos.idCurso)) {
      return { tipo: "invalida", mensaje: "Ese tutor no imparte el curso que elegiste." };
    }
    if (datos.horaFin <= datos.horaInicio) {
      return { tipo: "invalida", mensaje: "La hora de fin debe ser posterior a la de inicio." };
    }

    const inicio = instanteEnGuatemala(datos.fecha, datos.horaInicio);
    const fin = instanteEnGuatemala(datos.fecha, datos.horaFin);

    if (Number.isNaN(inicio.getTime())) {
      return { tipo: "invalida", mensaje: "La fecha de la tutoría no es válida." };
    }
    if (inicio.getTime() <= this.ahora().getTime()) {
      return {
        tipo: "invalida",
        mensaje: "Elige una fecha y una hora que todavía no hayan pasado.",
      };
    }

    const franja = franjaQueCubre(tutor.franjas, inicio, datos.horaInicio, datos.horaFin);
    if (!franja) {
      return {
        tipo: "invalida",
        mensaje: "Ese horario está fuera de la disponibilidad que el tutor publicó.",
      };
    }
    if (!modalidadCompatible(franja.modalidad, datos.modalidad)) {
      return {
        tipo: "invalida",
        mensaje: "El tutor no ofrece esa modalidad en el horario que elegiste.",
      };
    }

    const ocupadas = await this.repositorio.tutoriasProgramadasDe(tutor.idTutor, inicio, fin);
    if (ocupadas.some((ocupada) => seTraslapan(ocupada, { inicio, fin }))) {
      return {
        tipo: "invalida",
        mensaje: "El tutor ya tiene una tutoría agendada a esa hora. Elige otro horario.",
      };
    }

    const idTutoria = await this.repositorio.crearTutoria({
      idTutor: tutor.idTutor,
      idCurso: datos.idCurso,
      idEstudiante,
      fechaInicio: inicio,
      fechaFin: fin,
      modalidad: datos.modalidad,
      // El lugar o el enlace salen de la franja: es el dato que el tutor
      // publicó, y dejar que el estudiante lo escriba permitiría citarlo donde
      // el tutor nunca dijo que estaría.
      ubicacionEnlace: franja.ubicacionEnlace ?? null,
      observaciones: datos.observaciones,
    });

    return { tipo: "solicitada", idTutoria };
  }

  /**
   * Cancela una tutoría.
   *
   * Lo pueden hacer los dos: al estudiante le surge algo y al tutor también.
   * Solo mientras la cita siga en pie —agendada o aceptada—; una ya dada o ya
   * cancelada no se toca. Darla por impartida va por otro camino, con las
   * pruebas que respaldan las horas beca del tutor.
   */
  async resolver(idUsuario: number, idTutoria: number): Promise<ResultadoAccionTutoria> {
    const tutoria = await this.repositorio.tutoriaPorId(idTutoria);
    if (!tutoria) return { tipo: "no_encontrada" };

    if (tutoria.estado !== "PROGRAMADA" && tutoria.estado !== "ACEPTADA") {
      return {
        tipo: "no_permitida",
        mensaje: `Esta tutoría ya está ${ETIQUETAS_ESTADO[tutoria.estado] ?? "cerrada"}.`,
      };
    }

    const [idEstudiante, idTutor] = await Promise.all([
      this.repositorio.estudianteDeUsuario(idUsuario),
      this.repositorio.tutorDeUsuario(idUsuario),
    ]);

    const esTutor = idTutor !== null && idTutor === tutoria.idTutor;
    const esDueno = idEstudiante !== null && idEstudiante === tutoria.idEstudiante;

    if (!esTutor && !esDueno) return { tipo: "no_encontrada" };

    const aplicado = await this.repositorio.cancelarTutoria(idTutoria);

    return aplicado ? { tipo: "aplicada", estado: "CANCELADA" } : { tipo: "no_encontrada" };
  }
}

/** Cómo se nombra cada estado al explicar por qué ya no se puede cancelar. */
const ETIQUETAS_ESTADO: Record<string, string> = {
  RECHAZADA: "rechazada",
  COMPLETADA: "completada",
  CANCELADA: "cancelada",
};
