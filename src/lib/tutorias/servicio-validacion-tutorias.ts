import type { EstadoHorasTutoria, EstadoTutoria } from "@prisma/client";

/**
 * Doble validación de una tutoría.
 *
 * Una tutoría da horas beca al tutor, así que no basta con que él diga que la
 * dio. El recorrido es: el estudiante la agenda, el tutor la acepta o la
 * rechaza, y si la acepta sube una prueba del inicio y otra del final. El
 * estudiante, por su lado, confirma con una foto que el tutor sí se presentó.
 * Con esas tres pruebas AEUVG revisa y acepta —o no— las horas.
 *
 * Las reglas viven aquí y no en la ruta para poder probarlas sin base de
 * datos: son las que impiden que alguien se acredite horas de una tutoría que
 * no le corresponde o que todavía no ha ocurrido.
 */

export type TutoriaParaValidar = {
  idTutoria: number;
  idTutor: number;
  idEstudiante: number;
  estado: EstadoTutoria;
  estadoHoras: EstadoHorasTutoria;
  fechaInicio: Date;
  fechaFin: Date;
  pruebaEstudianteUrl: string | null;
};

export type PruebasDelTutor = { pruebaInicioUrl: string; pruebaFinUrl: string };

export interface RepositorioValidacionTutorias {
  tutoriaPorId(idTutoria: number): Promise<TutoriaParaValidar | null>;
  estudianteDeUsuario(idUsuario: number): Promise<number | null>;
  tutorDeUsuario(idUsuario: number): Promise<number | null>;
  responder(
    idTutoria: number,
    estado: "ACEPTADA" | "RECHAZADA",
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
  marcarPorTutor(idTutoria: number, pruebas: PruebasDelTutor, ahora: Date): Promise<boolean>;
  marcarPorEstudiante(idTutoria: number, pruebaUrl: string, ahora: Date): Promise<boolean>;
  /** Crea el registro de horas beca del tutor y cierra la tutoría. */
  aceptarHoras(
    idTutoria: number,
    idUsuarioRevisor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
  rechazarHoras(
    idTutoria: number,
    idUsuarioRevisor: number,
    comentario: string | null,
    ahora: Date
  ): Promise<boolean>;
}

export type ResultadoValidacion =
  { tipo: "aplicada" } | { tipo: "no_encontrada" } | { tipo: "no_permitida"; mensaje: string };

/**
 * Horas que se acreditan por una tutoría: exactamente lo que dura.
 *
 * Se redondea a dos decimales igual que los turnos del salón, para que una
 * tutoría de hora y media sean 1.5 horas y no un número con cola.
 */
export function horasDeTutoria(fechaInicio: Date, fechaFin: Date): number {
  const horas = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

  return Math.max(0, Math.round(horas * 100) / 100);
}

const ETIQUETAS_ESTADO: Record<EstadoTutoria, string> = {
  PROGRAMADA: "pendiente de tu respuesta",
  ACEPTADA: "aceptada",
  RECHAZADA: "rechazada",
  COMPLETADA: "completada",
  CANCELADA: "cancelada",
};

export class ServicioValidacionTutorias {
  constructor(
    private readonly repositorio: RepositorioValidacionTutorias,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  /** El tutor acepta o rechaza la tutoría que le agendaron. */
  async responder(
    idUsuario: number,
    idTutoria: number,
    decision: "aceptar" | "rechazar",
    comentario: string | null
  ): Promise<ResultadoValidacion> {
    const tutoria = await this.repositorio.tutoriaPorId(idTutoria);
    if (!tutoria) return { tipo: "no_encontrada" };

    const idTutor = await this.repositorio.tutorDeUsuario(idUsuario);
    // Una tutoría ajena responde como no encontrada, para no revelar que existe.
    if (idTutor === null || idTutor !== tutoria.idTutor) return { tipo: "no_encontrada" };

    if (tutoria.estado !== "PROGRAMADA") {
      return {
        tipo: "no_permitida",
        mensaje: `Esta tutoría ya está ${ETIQUETAS_ESTADO[tutoria.estado]}.`,
      };
    }

    const estado = decision === "aceptar" ? "ACEPTADA" : "RECHAZADA";
    const aplicado = await this.repositorio.responder(idTutoria, estado, comentario, this.ahora());

    return aplicado ? { tipo: "aplicada" } : { tipo: "no_encontrada" };
  }

  /**
   * El tutor da la tutoría por impartida con sus dos pruebas.
   *
   * Solo después de la hora de inicio: una prueba del arranque subida la
   * víspera no prueba nada.
   */
  async marcarComoDada(
    idUsuario: number,
    idTutoria: number,
    pruebas: PruebasDelTutor
  ): Promise<ResultadoValidacion> {
    const tutoria = await this.repositorio.tutoriaPorId(idTutoria);
    if (!tutoria) return { tipo: "no_encontrada" };

    const idTutor = await this.repositorio.tutorDeUsuario(idUsuario);
    if (idTutor === null || idTutor !== tutoria.idTutor) return { tipo: "no_encontrada" };

    if (tutoria.estado !== "ACEPTADA") {
      return {
        tipo: "no_permitida",
        mensaje:
          tutoria.estado === "PROGRAMADA"
            ? "Acepta la tutoría antes de darla por impartida."
            : `Esta tutoría ya está ${ETIQUETAS_ESTADO[tutoria.estado]}.`,
      };
    }

    if (tutoria.estadoHoras === "PENDIENTE") {
      return { tipo: "no_permitida", mensaje: "Ya enviaste las pruebas de esta tutoría." };
    }

    if (tutoria.fechaInicio.getTime() > this.ahora().getTime()) {
      return {
        tipo: "no_permitida",
        mensaje: "La tutoría todavía no empieza. Sube las pruebas cuando la hayas dado.",
      };
    }

    const aplicado = await this.repositorio.marcarPorTutor(idTutoria, pruebas, this.ahora());

    return aplicado ? { tipo: "aplicada" } : { tipo: "no_encontrada" };
  }

  /**
   * El estudiante confirma que el tutor sí se presentó.
   *
   * Puede hacerlo aunque el tutor no haya subido todavía sus pruebas: el orden
   * en que cada uno entra a la página no es cosa del otro.
   */
  async confirmarComoEstudiante(
    idUsuario: number,
    idTutoria: number,
    pruebaUrl: string
  ): Promise<ResultadoValidacion> {
    const tutoria = await this.repositorio.tutoriaPorId(idTutoria);
    if (!tutoria) return { tipo: "no_encontrada" };

    const idEstudiante = await this.repositorio.estudianteDeUsuario(idUsuario);
    if (idEstudiante === null || idEstudiante !== tutoria.idEstudiante) {
      return { tipo: "no_encontrada" };
    }

    if (tutoria.estado !== "ACEPTADA" && tutoria.estado !== "COMPLETADA") {
      return {
        tipo: "no_permitida",
        mensaje:
          tutoria.estado === "PROGRAMADA"
            ? "El tutor todavía no ha aceptado esta tutoría."
            : `Esta tutoría está ${ETIQUETAS_ESTADO[tutoria.estado]}.`,
      };
    }

    if (tutoria.pruebaEstudianteUrl !== null) {
      return { tipo: "no_permitida", mensaje: "Ya confirmaste esta tutoría." };
    }

    if (tutoria.fechaInicio.getTime() > this.ahora().getTime()) {
      return {
        tipo: "no_permitida",
        mensaje: "La tutoría todavía no empieza. Confírmala cuando la hayas recibido.",
      };
    }

    const aplicado = await this.repositorio.marcarPorEstudiante(idTutoria, pruebaUrl, this.ahora());

    return aplicado ? { tipo: "aplicada" } : { tipo: "no_encontrada" };
  }

  /**
   * AEUVG acepta o rechaza las horas del tutor.
   *
   * Aceptarlas crea el registro de horas beca del tutor por lo que duró la
   * tutoría, y queda pendiente de acreditar como cualquier otro apoyo. Puede
   * aceptarlas aunque falte la confirmación del estudiante: no siempre entra a
   * la página, y la ficha señala qué falta para que la decisión se tome a la
   * vista de eso.
   */
  async revisarHoras(
    idUsuarioRevisor: number,
    idTutoria: number,
    decision: "aceptar" | "rechazar",
    comentario: string | null
  ): Promise<ResultadoValidacion> {
    const tutoria = await this.repositorio.tutoriaPorId(idTutoria);
    if (!tutoria) return { tipo: "no_encontrada" };

    if (tutoria.estadoHoras !== "PENDIENTE") {
      return {
        tipo: "no_permitida",
        mensaje:
          tutoria.estadoHoras === "SIN_ENVIAR"
            ? "El tutor todavía no ha enviado las pruebas de esta tutoría."
            : "Estas horas ya se revisaron.",
      };
    }

    const ahora = this.ahora();
    const aplicado =
      decision === "aceptar"
        ? await this.repositorio.aceptarHoras(idTutoria, idUsuarioRevisor, comentario, ahora)
        : await this.repositorio.rechazarHoras(idTutoria, idUsuarioRevisor, comentario, ahora);

    return aplicado ? { tipo: "aplicada" } : { tipo: "no_encontrada" };
  }
}
