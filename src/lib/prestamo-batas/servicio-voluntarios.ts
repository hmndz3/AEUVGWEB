import type {
  RepositorioVoluntarios,
  ResultadoAsignacion,
} from "@/lib/prestamo-batas/repositorio-voluntarios";
import type { DatosPostulacionVoluntario } from "@/validators/prestamo-batas";

export type ResultadoPostulacionVoluntario =
  | { tipo: "enviada"; idPostulacion: number }
  | { tipo: "sin_estudiante" }
  | { tipo: "invalida"; errores: Record<string, string> };

export type ResultadoRevisionVoluntario =
  | { tipo: "resuelta"; estado: "APROBADA" | "RECHAZADA"; asignacion: ResultadoAsignacion | null }
  | { tipo: "no_encontrada" }
  | { tipo: "no_permitida"; mensaje: string };

export type ResultadoDesasignacion = { tipo: "desasignado" } | { tipo: "no_encontrado" };

/**
 * Postulaciones para ser voluntario del salón y su revisión por AEUVG.
 *
 * Las reglas propias: no se admite una segunda postulación mientras haya una sin
 * resolver; solo se postula a turnos activos, con cupo libre y a los que el
 * estudiante no esté ya asignado; y el administrador solo asigna turnos que el
 * estudiante pidió, sin pasar de dos voluntarios por turno. Aprobar es lo que
 * concede el rol de voluntario y habilita su pestaña.
 */
export class ServicioVoluntarios {
  constructor(
    private readonly repositorio: RepositorioVoluntarios,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async postular(
    idUsuario: number,
    datos: DatosPostulacionVoluntario
  ): Promise<ResultadoPostulacionVoluntario> {
    const estudiante = await this.repositorio.estudianteDeUsuario(idUsuario);
    if (!estudiante) return { tipo: "sin_estudiante" };

    if (await this.repositorio.tienePostulacionPendiente(estudiante.idEstudiante)) {
      return {
        tipo: "invalida",
        errores: {
          general:
            "Ya tienes una postulación esperando revisión. AEUVG te avisará cuando la resuelva.",
        },
      };
    }

    const info = new Map(
      (await this.repositorio.infoTurnos(datos.idsTurnos)).map((turno) => [turno.idTurno, turno])
    );
    const yaAsignados = new Set(
      await this.repositorio.turnosAsignadosActivosDe(estudiante.idEstudiante)
    );

    for (const idTurno of datos.idsTurnos) {
      const turno = info.get(idTurno);
      if (!turno || !turno.activo) {
        return {
          tipo: "invalida",
          errores: { idsTurnos: "Alguno de los turnos elegidos ya no está disponible." },
        };
      }
      if (yaAsignados.has(idTurno)) {
        return {
          tipo: "invalida",
          errores: { idsTurnos: "Ya estás asignado a alguno de los turnos elegidos." },
        };
      }
      if (turno.asignadosActivos >= turno.cupo) {
        return {
          tipo: "invalida",
          errores: {
            idsTurnos: "Alguno de los turnos elegidos ya tiene a sus dos voluntarios.",
          },
        };
      }
    }

    const idPostulacion = await this.repositorio.crearPostulacion({
      idEstudiante: estudiante.idEstudiante,
      comentarioSolicitante: datos.comentarioSolicitante,
      idsTurnos: datos.idsTurnos,
    });

    return { tipo: "enviada", idPostulacion };
  }

  async revisar(
    idPostulacion: number,
    decision: "aprobar" | "rechazar",
    idsTurnos: readonly number[],
    comentario: string | null,
    revisadaPor: number
  ): Promise<ResultadoRevisionVoluntario> {
    const postulacion = await this.repositorio.postulacionPorId(idPostulacion);
    if (!postulacion) return { tipo: "no_encontrada" };

    if (postulacion.estado !== "PENDIENTE") {
      return {
        tipo: "no_permitida",
        mensaje: `Esta postulación ya fue ${postulacion.estado === "APROBADA" ? "aprobada" : "rechazada"}.`,
      };
    }

    const ahora = this.ahora();

    if (decision === "rechazar") {
      const aplicado = await this.repositorio.rechazarPostulacion(
        idPostulacion,
        revisadaPor,
        comentario,
        ahora
      );

      return aplicado
        ? { tipo: "resuelta", estado: "RECHAZADA", asignacion: null }
        : { tipo: "no_encontrada" };
    }

    const pedidos = new Set(postulacion.idsTurnos);
    if (!idsTurnos.every((idTurno) => pedidos.has(idTurno))) {
      return {
        tipo: "no_permitida",
        mensaje: "Solo puedes asignar turnos que el estudiante eligió en su postulación.",
      };
    }

    const asignacion = await this.repositorio.aprobarPostulacion(
      idPostulacion,
      postulacion.idEstudiante,
      idsTurnos,
      revisadaPor,
      comentario,
      ahora
    );

    if (asignacion.asignados.length === 0) {
      return {
        tipo: "no_permitida",
        mensaje: "Los turnos elegidos ya tienen a sus dos voluntarios. Elige otros turnos.",
      };
    }

    return { tipo: "resuelta", estado: "APROBADA", asignacion };
  }

  async desasignar(idAsignacion: number): Promise<ResultadoDesasignacion> {
    const aplicado = await this.repositorio.desasignar(idAsignacion);

    return aplicado ? { tipo: "desasignado" } : { tipo: "no_encontrado" };
  }
}
