import type { ErrorFilaImportacion, FilaOmitida } from "@/lib/importacion/reporte";
import type { FilaCrudaCurso } from "@/lib/tutorias/importacion-cursos";
import { esquemaCursoAdmin, type DatosCursoAdmin } from "@/validators/tutoria";

/** Una fila lista para guardarse. */
export type FilaValidaCurso = { fila: number; datos: DatosCursoAdmin };

export type ValidacionCursos = {
  total: number;
  validas: FilaValidaCurso[];
  errores: ErrorFilaImportacion[];
  repetidas: FilaOmitida[];
};

/** Nombre del campo tal como lo ve quien llenó la hoja. */
const CAMPOS: Record<string, string> = {
  codigo: "Código",
  nombre: "Nombre del curso",
};

/**
 * Revisa las filas del archivo de cursos.
 *
 * El código es lo que identifica a un curso, así que es lo que decide si la
 * fila es nueva: un código ya registrado —en la base o más arriba en el mismo
 * archivo— se omite en lugar de dar error, para que el archivo completo pueda
 * volver a cargarse cuando se le agregan cursos sin duplicar los de antes.
 *
 * Cuando el nombre de la hoja no coincide con el guardado se dice en el
 * reporte, pero no se cambia: renombrar un curso del catálogo es una decisión
 * de AEUVG y se hace desde el panel, no de paso en una carga masiva.
 */
export function validarFilasDeCursos(
  filas: FilaCrudaCurso[],
  registrados: Map<string, string>
): ValidacionCursos {
  const validas: FilaValidaCurso[] = [];
  const errores: ErrorFilaImportacion[] = [];
  const repetidas: FilaOmitida[] = [];
  const conocidos = new Map(registrados);

  for (const cruda of filas) {
    const referencia = cruda.codigo !== "" ? cruda.codigo : cruda.nombre;
    const resultado = esquemaCursoAdmin.safeParse({
      codigo: cruda.codigo,
      nombre: cruda.nombre,
      activo: true,
    });

    if (!resultado.success) {
      for (const problema of resultado.error.issues) {
        const campo = String(problema.path[0] ?? "");
        errores.push({
          fila: cruda.fila,
          referencia,
          campo: CAMPOS[campo] ?? "Curso",
          mensaje: problema.message,
        });
      }
      continue;
    }

    const { codigo, nombre } = resultado.data;
    const registrado = conocidos.get(codigo);

    if (registrado !== undefined) {
      // Un código que ya estaba en el catálogo y uno que se repite dentro del
      // archivo se omiten igual, pero no se explican igual: en el segundo caso
      // el problema está en la hoja y hay que decirlo así.
      const delArchivo = !registrados.has(codigo);

      repetidas.push({
        fila: cruda.fila,
        referencia: codigo,
        mensaje: delArchivo
          ? "Ese código ya venía en una fila anterior del archivo, así que el curso se creó una sola vez."
          : registrado === nombre
            ? "Ya existe un curso con ese código, así que no se creó otro."
            : `Ya existe un curso con ese código, registrado como «${registrado}». Se conservó ese nombre; cámbialo desde el catálogo si hace falta.`,
      });
      continue;
    }

    conocidos.set(codigo, nombre);
    validas.push({ fila: cruda.fila, datos: resultado.data });
  }

  return { total: filas.length, validas, errores, repetidas };
}
