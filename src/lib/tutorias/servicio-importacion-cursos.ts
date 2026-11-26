import type {
  ErrorFilaImportacion,
  ResultadoImportacionArchivo,
  ResultadoRevisionArchivo,
} from "@/lib/importacion/reporte";
import { leerFilasDeCursos } from "@/lib/tutorias/importacion-cursos";
import type { RepositorioImportacionCursos } from "@/lib/tutorias/repositorio-importacion-cursos";
import type { ResultadoCurso } from "@/lib/tutorias/servicio-cursos";
import {
  validarFilasDeCursos,
  type FilaValidaCurso,
} from "@/lib/tutorias/validacion-importacion-cursos";
import type { DatosCursoAdmin } from "@/validators/tutoria";

/**
 * Lo que la importación necesita para dar de alta un curso.
 *
 * Es el servicio del catálogo visto por la rendija de la única operación que
 * hace falta. Se declara así para que la importación pueda probarse sin montar
 * el repositorio completo.
 */
export interface CreadorDeCursos {
  crear(datos: DatosCursoAdmin): Promise<ResultadoCurso>;
}

/**
 * Carga del catálogo de cursos desde un archivo de Excel.
 *
 * AEUVG ya lleva la lista de cursos en una hoja de cálculo; esto la sube de una
 * vez en lugar de abrir el formulario del panel una vez por curso. Los cursos
 * se crean por el mismo servicio que usa el panel, de modo que las reglas del
 * código y del nombre sean exactamente las mismas.
 */
export class ServicioImportacionCursos {
  constructor(
    private readonly repositorio: RepositorioImportacionCursos,
    private readonly cursos: CreadorDeCursos
  ) {}

  /** Lee y valida sin escribir nada. */
  async revisar(archivo: Buffer): Promise<ResultadoRevisionArchivo> {
    const lectura = await leerFilasDeCursos(archivo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = validarFilasDeCursos(lectura.filas, await this.repositorio.registrados());

    return {
      tipo: "revisado",
      total: validacion.total,
      correctas: validacion.validas.length,
      fallidas: validacion.errores.length,
      errores: validacion.errores,
      repetidas: validacion.repetidas,
      avisos: [],
    };
  }

  /**
   * Crea los cursos nuevos del archivo.
   *
   * Cada curso va por separado: que una fila falle no debe impedir que entren
   * las demás.
   */
  async importar(archivo: Buffer): Promise<ResultadoImportacionArchivo> {
    const lectura = await leerFilasDeCursos(archivo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = validarFilasDeCursos(lectura.filas, await this.repositorio.registrados());
    const errores = [...validacion.errores];

    if (validacion.validas.length === 0) {
      return {
        tipo: "sin_filas_nuevas",
        total: validacion.total,
        correctas: 0,
        fallidas: errores.length,
        errores,
        repetidas: validacion.repetidas,
        avisos: [],
      };
    }

    let guardados = 0;

    for (const valida of validacion.validas) {
      const resultado = await this.cursos.crear(valida.datos).catch(() => null);

      if (!resultado || resultado.tipo !== "guardado") {
        errores.push(problemaAlGuardar(valida, resultado));
        continue;
      }

      guardados += 1;
    }

    return {
      tipo: "importado",
      guardadas: guardados,
      total: validacion.total,
      correctas: guardados,
      fallidas: errores.length,
      errores,
      repetidas: validacion.repetidas,
      avisos: [],
    };
  }
}

function problemaAlGuardar(
  valida: FilaValidaCurso,
  resultado: ResultadoCurso | null
): ErrorFilaImportacion {
  return {
    fila: valida.fila,
    referencia: valida.datos.codigo,
    campo: "Curso",
    mensaje:
      resultado?.tipo === "invalido"
        ? (Object.values(resultado.errores)[0] ?? "No se pudo guardar el curso.")
        : "No se pudo guardar el curso. Revisa la fila e inténtalo de nuevo.",
  };
}
