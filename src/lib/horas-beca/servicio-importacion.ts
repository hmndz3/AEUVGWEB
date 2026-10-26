import { leerFilasDeExcel, type ResultadoLectura } from "@/lib/horas-beca/importacion";
import type { RepositorioImportacion } from "@/lib/horas-beca/repositorio-importacion";
import { validarFilas, type ErrorFila } from "@/lib/horas-beca/validacion-importacion";

export type ResumenImportacion = {
  total: number;
  correctas: number;
  fallidas: number;
  errores: ErrorFila[];
};

export type ResultadoRevision =
  | ({ tipo: "revisado" } & ResumenImportacion)
  | { tipo: "sin_columnas"; faltantes: string[] }
  | { tipo: "demasiadas_filas"; total: number; maximo: number }
  | { tipo: "ilegible" };

export type ResultadoImportacion =
  | ({ tipo: "importado"; idImportacion: number } & ResumenImportacion)
  | { tipo: "sin_columnas"; faltantes: string[] }
  | { tipo: "demasiadas_filas"; total: number; maximo: number }
  | { tipo: "ilegible" }
  | { tipo: "sin_filas_validas"; errores: ErrorFila[]; total: number };

/** Traduce el resultado de la lectura a la respuesta del servicio. */
function problemaDeLectura(
  lectura: Exclude<ResultadoLectura, { tipo: "leido" }>
): Exclude<ResultadoRevision, { tipo: "revisado" }> {
  return lectura;
}

/**
 * Importación de registros de horas beca desde un archivo de Excel.
 *
 * El trabajo está partido en dos operaciones a propósito. La revisión lee y
 * valida sin tocar la base, para que AEUVG vea qué filas tienen problemas y
 * decida si corrige el archivo o sigue adelante. La importación repite la
 * lectura y guarda solo lo correcto. Repetir la lectura cuesta poco y evita
 * guardar el archivo a medio camino entre las dos peticiones.
 */
export class ServicioImportacionHoras {
  constructor(private readonly repositorio: RepositorioImportacion) {}

  /** Lee y valida sin escribir nada. */
  async revisar(archivo: Buffer): Promise<ResultadoRevision> {
    const lectura = await leerFilasDeExcel(archivo);
    if (lectura.tipo !== "leido") return problemaDeLectura(lectura);

    const { validas, errores, total } = validarFilas(lectura.filas);

    return {
      tipo: "revisado",
      total,
      correctas: validas.length,
      fallidas: errores.length,
      errores,
    };
  }

  /**
   * Guarda las filas correctas y deja constancia de la importación.
   *
   * El vínculo con la cuenta se resuelve por carnet, igual que al registrar
   * horas a mano: los carnets se consultan de una sola vez y no uno por fila,
   * porque un archivo histórico repite al mismo estudiante decenas de veces.
   */
  async importar(
    archivo: Buffer,
    nombreArchivo: string,
    realizadaPor: number
  ): Promise<ResultadoImportacion> {
    const lectura = await leerFilasDeExcel(archivo);
    if (lectura.tipo !== "leido") return problemaDeLectura(lectura);

    const { validas, errores, total } = validarFilas(lectura.filas);

    if (validas.length === 0) {
      return { tipo: "sin_filas_validas", errores, total };
    }

    const carnets = [...new Set(validas.map(({ datos }) => datos.carnet))];
    const cuentas = await this.repositorio.estudiantesPorCarnet(carnets);

    const idImportacion = await this.repositorio.registrarImportacion({
      realizadaPor,
      nombreArchivo,
      totalFilas: total,
      filasExitosas: validas.length,
      filasFallidas: errores.length,
      errores,
    });

    await this.repositorio.crearRegistrosImportados(
      validas.map(({ datos }) => {
        const cuenta = cuentas.get(datos.carnet);

        return {
          ...datos,
          // Con cuenta vinculada se guarda su nombre, que es el verificado.
          nombreEstudiante: cuenta?.nombreCompleto ?? datos.nombreEstudiante,
          idEstudiante: cuenta?.idEstudiante ?? null,
        };
      }),
      idImportacion,
      realizadaPor
    );

    return {
      tipo: "importado",
      idImportacion,
      total,
      correctas: validas.length,
      fallidas: errores.length,
      errores,
    };
  }
}
