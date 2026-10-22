import { normalizarCarnet, textoDeBusquedaRegistroHora } from "@/lib/horas-beca/busqueda-horas";
import type {
  DatosRegistroHoraPersistidos,
  RepositorioHorasBeca,
} from "@/lib/horas-beca/repositorio-horas-beca";

/** Horas que puede sumar un solo registro. Más de un día no es un apoyo, es un error de captura. */
export const MAXIMO_HORAS_POR_REGISTRO = 24;

/**
 * Registros que admite una operación en lote. El límite es el tamaño de la
 * selección que cabe en pantalla con holgura: una petición con miles de
 * identificadores no viene de alguien revisando filas.
 */
export const MAXIMO_REGISTROS_EN_LOTE = 200;

/**
 * Identificadores de una operación en lote, sin repetidos y sin valores que no
 * puedan ser un registro. La selección llega de una petición, así que no se
 * confía en que venga limpia.
 */
function normalizarSeleccion(ids: readonly number[]): number[] {
  return [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
}

/**
 * Día de calendario de hoy en Guatemala, como la medianoche en UTC con la que se
 * guarda la fecha de la actividad. Se calcula en la zona del país y no en la del
 * servidor: entre las 18:00 y la medianoche de Guatemala, en UTC ya es el día
 * siguiente, y una actividad registrada esa noche habría quedado rechazada por
 * futura.
 */
function hoyEnGuatemala(ahora: Date): Date {
  const clave = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Guatemala",
  }).format(ahora);

  return new Date(`${clave}T00:00:00.000Z`);
}

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

export type ResultadoAcreditacion =
  | { tipo: "aplicada"; solicitados: number; afectados: number }
  | { tipo: "invalida"; mensaje: string };

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
  /**
   * El reloj se recibe como dependencia para poder probar el rechazo de una
   * fecha futura sin depender del día en que se ejecuten las pruebas.
   */
  constructor(
    private readonly repositorio: RepositorioHorasBeca,
    private readonly ahora: () => Date = () => new Date()
  ) {}

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
   * Acredita los registros indicados.
   *
   * La operación es en lote incluso cuando se aplica sobre uno: AEUVG cierra
   * periodos completos y acreditar fila por fila era justamente el trabajo que
   * la hoja de cálculo imponía. Devuelve cuántos registros cambiaron además de
   * cuántos se pidieron, porque una selección mixta deja los ya acreditados sin
   * tocar y el panel tiene que poder decirlo.
   */
  async acreditar(
    ids: readonly number[],
    acreditadoPor: number,
    fecha: Date
  ): Promise<ResultadoAcreditacion> {
    const seleccion = normalizarSeleccion(ids);

    if (seleccion.length === 0) {
      return { tipo: "invalida", mensaje: "Selecciona al menos un registro." };
    }
    if (seleccion.length > MAXIMO_REGISTROS_EN_LOTE) {
      return {
        tipo: "invalida",
        mensaje: `No se pueden acreditar más de ${MAXIMO_REGISTROS_EN_LOTE} registros a la vez.`,
      };
    }

    const afectados = await this.repositorio.acreditar(seleccion, acreditadoPor, fecha);

    return { tipo: "aplicada", solicitados: seleccion.length, afectados };
  }

  /**
   * Devuelve a pendiente una acreditación aplicada por error.
   *
   * Existe porque la acreditación en lote se aplica sobre una selección y una
   * selección se puede equivocar: sin reversión, corregirla exigiría borrar los
   * registros y volver a capturarlos.
   */
  async revertir(ids: readonly number[]): Promise<ResultadoAcreditacion> {
    const seleccion = normalizarSeleccion(ids);

    if (seleccion.length === 0) {
      return { tipo: "invalida", mensaje: "Selecciona al menos un registro." };
    }
    if (seleccion.length > MAXIMO_REGISTROS_EN_LOTE) {
      return {
        tipo: "invalida",
        mensaje: `No se pueden revertir más de ${MAXIMO_REGISTROS_EN_LOTE} registros a la vez.`,
      };
    }

    const afectados = await this.repositorio.revertirAcreditacion(seleccion);

    return { tipo: "aplicada", solicitados: seleccion.length, afectados };
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
    } else if (datos.fechaActividad.getTime() > hoyEnGuatemala(this.ahora()).getTime()) {
      // AEUVG lo señaló en la revisión del sprint: una fecha futura solo puede
      // ser un error de captura, porque las horas se registran por el apoyo ya
      // prestado, y además dejaba el registro fuera de cualquier periodo que se
      // estuviera cerrando.
      errores.fechaActividad = "La actividad no puede tener una fecha posterior a hoy.";
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
