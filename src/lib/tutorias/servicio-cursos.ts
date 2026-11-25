import type { RepositorioCursos } from "@/lib/tutorias/repositorio-cursos";
import type { DatosCursoAdmin } from "@/validators/tutoria";

const MENSAJE_CODIGO_REPETIDO = "Ya existe un curso con ese código.";

export type ResultadoCurso =
  | { tipo: "guardado"; idCurso: number }
  | { tipo: "no_encontrado" }
  | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoEliminarCurso =
  { tipo: "eliminado" } | { tipo: "no_encontrado" } | { tipo: "en_uso"; mensaje: string };

/**
 * Catálogo de cursos que se ofrecen en la postulación y en el directorio.
 *
 * Lo administra AEUVG: los estudiantes eligen de esta lista y, si su curso no
 * está, lo proponen con "Otro". Un curso solo se borra si nadie lo usa; si ya
 * tiene postulaciones, tutores o tutorías, se desactiva, para no perder el
 * historial de quién respaldó qué.
 */
export class ServicioCursos {
  constructor(private readonly repositorio: RepositorioCursos) {}

  async crear(datos: DatosCursoAdmin): Promise<ResultadoCurso> {
    if (await this.repositorio.codigoEnUso(datos.codigo)) {
      return { tipo: "invalido", errores: { codigo: MENSAJE_CODIGO_REPETIDO } };
    }

    return { tipo: "guardado", idCurso: await this.repositorio.crear(datos) };
  }

  async actualizar(idCurso: number, datos: DatosCursoAdmin): Promise<ResultadoCurso> {
    if (await this.repositorio.codigoEnUso(datos.codigo, idCurso)) {
      return { tipo: "invalido", errores: { codigo: MENSAJE_CODIGO_REPETIDO } };
    }

    const aplicado = await this.repositorio.actualizar(idCurso, datos);

    return aplicado ? { tipo: "guardado", idCurso } : { tipo: "no_encontrado" };
  }

  async eliminar(idCurso: number): Promise<ResultadoEliminarCurso> {
    const usos = await this.repositorio.usos(idCurso);
    if (!usos) return { tipo: "no_encontrado" };

    if (usos.postulaciones + usos.tutores + usos.tutorias > 0) {
      return {
        tipo: "en_uso",
        mensaje:
          "Este curso ya aparece en postulaciones, tutores o tutorías. Desactívalo para dejar de ofrecerlo sin perder ese historial.",
      };
    }

    const eliminado = await this.repositorio.eliminar(idCurso);

    return eliminado ? { tipo: "eliminado" } : { tipo: "no_encontrado" };
  }
}
