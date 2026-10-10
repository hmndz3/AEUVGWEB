import { normalizarCarnet, textoDeBusquedaRegistroHora } from "@/lib/horas-beca/busqueda-horas";
import type {
  DatosRegistroHoraPersistidos,
  RepositorioHorasBeca,
} from "@/lib/horas-beca/repositorio-horas-beca";

/** Horas que puede sumar un solo registro. Más de un día no es un apoyo, es un error de captura. */
export const MAXIMO_HORAS_POR_REGISTRO = 24;

/** Registro de horas tal como lo envía el panel, antes de resolver el vínculo. */
export type DatosRegistroHora = {
  carnet: string;
  nombreEstudiante: string;
  fechaActividad: Date;
  horarioApoyo: string;
  descripcionActividad: string;
  cantidadHoras: number;
  observaciones: string | null;
};

export type ResultadoRegistroHora =
  | { tipo: "guardado"; id: number; vinculado: boolean }
  | { tipo: "no_encontrado" }
  | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoEliminacionHora = { tipo: "eliminado" } | { tipo: "no_encontrado" };

/**
 * Registro de las horas beca del estudiantado.
 *
 * Sigue la misma separación entre servicio y repositorio que el resto del
 * proyecto: las reglas viven aquí y pueden probarse sin base de datos.
 *
 * La regla propia de este módulo es que el dato que identifica al estudiante es
 * su carnet y no su cuenta. AEUVG carga las horas de una hoja de cálculo en la
 * que buena parte de los carnets todavía no se ha registrado en la plataforma,
 * así que el vínculo con la cuenta se resuelve si existe y se deja pendiente si
 * no, en lugar de impedir el registro.
 */
export class ServicioHorasBeca {
  constructor(private readonly repositorio: RepositorioHorasBeca) {}

  async crear(datos: DatosRegistroHora, creadoPor: number): Promise<ResultadoRegistroHora> {
    const preparado = await this.preparar(datos);
    if (!preparado.valido) return { tipo: "invalido", errores: preparado.errores };

    const id = await this.repositorio.crear(preparado.datos, creadoPor);

    return { tipo: "guardado", id, vinculado: preparado.datos.idEstudiante !== null };
  }

  async editar(id: number, datos: DatosRegistroHora): Promise<ResultadoRegistroHora> {
    const preparado = await this.preparar(datos);
    if (!preparado.valido) return { tipo: "invalido", errores: preparado.errores };

    const actualizado = await this.repositorio.actualizar(id, preparado.datos);
    if (!actualizado) return { tipo: "no_encontrado" };

    return { tipo: "guardado", id, vinculado: preparado.datos.idEstudiante !== null };
  }

  /**
   * Elimina un registro de forma definitiva. No hay baja lógica, a diferencia de
   * las organizaciones: una fila de horas mal capturada no tiene historial que
   * preservar y dejarla oculta solo descuadraría los totales del estudiante.
   */
  async eliminar(id: number): Promise<ResultadoEliminacionHora> {
    const eliminado = await this.repositorio.eliminar(id);

    return eliminado ? { tipo: "eliminado" } : { tipo: "no_encontrado" };
  }

  /**
   * Comprueba las reglas y resuelve el vínculo con la cuenta del carnet.
   *
   * Las comprobaciones se repiten aquí aunque el esquema del endpoint ya haya
   * validado el cuerpo: el esquema protege la petición y el servicio protege la
   * regla, que debe valer también para la importación del Sprint 5, que no pasa
   * por ningún formulario.
   */
  private async preparar(
    datos: DatosRegistroHora
  ): Promise<
    | { valido: true; datos: DatosRegistroHoraPersistidos }
    | { valido: false; errores: Record<string, string> }
  > {
    const carnet = normalizarCarnet(datos.carnet);
    const errores: Record<string, string> = {};

    if (carnet.length === 0) errores.carnet = "Indica el carnet del estudiante.";
    if (datos.nombreEstudiante.trim().length === 0) {
      errores.nombreEstudiante = "Indica el nombre del estudiante.";
    }
    if (datos.descripcionActividad.trim().length === 0) {
      errores.descripcionActividad = "Indica en qué actividad se apoyó.";
    }
    if (Number.isNaN(datos.fechaActividad.getTime())) {
      errores.fechaActividad = "Indica la fecha de la actividad.";
    }
    if (
      !Number.isFinite(datos.cantidadHoras) ||
      datos.cantidadHoras <= 0 ||
      datos.cantidadHoras > MAXIMO_HORAS_POR_REGISTRO
    ) {
      errores.cantidadHoras = `La cantidad de horas debe ser mayor que cero y no exceder ${MAXIMO_HORAS_POR_REGISTRO}.`;
    }

    if (Object.keys(errores).length > 0) return { valido: false, errores };

    const cuenta = await this.repositorio.estudianteDeCarnet(carnet);
    // Con la cuenta vinculada se guarda su nombre, que es el verificado contra
    // el correo institucional; sin ella, el que AEUVG escribió en su hoja.
    const nombreEstudiante = cuenta?.nombreCompleto ?? datos.nombreEstudiante.trim();

    return {
      valido: true,
      datos: {
        carnet,
        nombreEstudiante,
        idEstudiante: cuenta?.idEstudiante ?? null,
        fechaActividad: datos.fechaActividad,
        horarioApoyo: datos.horarioApoyo.trim(),
        descripcionActividad: datos.descripcionActividad.trim(),
        cantidadHoras: datos.cantidadHoras,
        observaciones: datos.observaciones,
        textoBusqueda: textoDeBusquedaRegistroHora({
          carnet,
          nombreEstudiante,
          descripcionActividad: datos.descripcionActividad,
        }),
      },
    };
  }
}
