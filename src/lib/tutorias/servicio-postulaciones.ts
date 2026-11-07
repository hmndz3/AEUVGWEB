import type { RepositorioTutorias } from "@/lib/tutorias/repositorio-tutorias";
import { NOTA_MINIMA_TUTOR, type DatosPostulacionTutor } from "@/validators/tutoria";

export type ResultadoPostulacion =
  | { tipo: "enviada"; idPostulacion: number }
  | { tipo: "sin_estudiante" }
  | { tipo: "invalida"; errores: Record<string, string> };

export type ResultadoRevision =
  | { tipo: "resuelta"; estado: "APROBADA" | "RECHAZADA"; idTutor: number | null }
  | { tipo: "no_encontrada" }
  | { tipo: "no_permitida"; mensaje: string };

/**
 * Postulaciones para ser tutor y su revisión por parte de AEUVG.
 *
 * Sigue la misma separación entre servicio y repositorio que el resto del
 * proyecto: las reglas viven aquí y se prueban sin base de datos.
 *
 * Las reglas propias son tres. La nota respalda el curso, no a la persona: se
 * exige por curso y no como promedio, porque quien sacó cien en cálculo puede
 * no estar en condiciones de dar química. No se admite una segunda postulación
 * mientras haya una sin resolver, que solo duplicaría el trabajo de revisión. Y
 * aprobar es lo que crea al tutor y le concede el rol, de modo que nadie llegue
 * al directorio sin que AEUVG lo haya revisado.
 */
export class ServicioPostulaciones {
  constructor(
    private readonly repositorio: RepositorioTutorias,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async postular(idUsuario: number, datos: DatosPostulacionTutor): Promise<ResultadoPostulacion> {
    const estudiante = await this.repositorio.estudianteDeUsuario(idUsuario);
    if (!estudiante) return { tipo: "sin_estudiante" };

    if (await this.repositorio.esTutor(estudiante.idEstudiante)) {
      return {
        tipo: "invalida",
        errores: {
          general:
            "Ya eres tutor en la plataforma. Para impartir otro curso, escríbele a AEUVG desde tu sección de tutorías.",
        },
      };
    }
    if (await this.repositorio.tienePostulacionPendiente(estudiante.idEstudiante)) {
      return {
        tipo: "invalida",
        errores: {
          general:
            "Ya tienes una postulación esperando revisión. AEUVG te avisará cuando la resuelva.",
        },
      };
    }

    const bajas = datos.cursos.filter((curso) => curso.notaObtenida < NOTA_MINIMA_TUTOR);
    if (bajas.length > 0) {
      return {
        tipo: "invalida",
        errores: {
          cursos: `Para ser tutor de un curso hace falta una nota de al menos ${NOTA_MINIMA_TUTOR}. Revisa la de ${bajas.length === 1 ? "un curso" : `${bajas.length} cursos`}.`,
        },
      };
    }

    const existentes = await this.repositorio.cursosActivos(
      datos.cursos.map((curso) => curso.idCurso)
    );
    if (existentes.length !== datos.cursos.length) {
      return {
        tipo: "invalida",
        errores: { cursos: "Alguno de los cursos elegidos ya no está disponible." },
      };
    }

    const idPostulacion = await this.repositorio.crearPostulacion({
      idEstudiante: estudiante.idEstudiante,
      comentarioSolicitante: datos.comentarioSolicitante,
      cursos: datos.cursos,
    });

    return { tipo: "enviada", idPostulacion };
  }

  /**
   * Resuelve una postulación pendiente.
   *
   * Una ya resuelta no se vuelve a tocar: su comentario y su fecha son el
   * registro de lo que AEUVG decidió, y reescribirlos borraría ese rastro.
   */
  async revisar(
    idPostulacion: number,
    decision: "aprobar" | "rechazar",
    comentario: string | null,
    revisadaPor: number
  ): Promise<ResultadoRevision> {
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
        ? { tipo: "resuelta", estado: "RECHAZADA", idTutor: null }
        : { tipo: "no_encontrada" };
    }

    const idTutor = await this.repositorio.aprobarPostulacion(
      idPostulacion,
      postulacion.idEstudiante,
      postulacion.cursos,
      revisadaPor,
      comentario,
      ahora
    );

    return { tipo: "resuelta", estado: "APROBADA", idTutor };
  }
}
