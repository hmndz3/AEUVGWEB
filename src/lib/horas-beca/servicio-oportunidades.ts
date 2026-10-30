import {
  aDatosPersistidos,
  type RepositorioOportunidades,
} from "@/lib/horas-beca/repositorio-oportunidades";
import {
  ESTADO_DE_ACCION,
  ETIQUETAS_ESTADO_OPORTUNIDAD,
  type AccionOportunidad,
  type DatosOportunidadAdmin,
} from "@/validators/oportunidad-admin";

export type ResultadoOportunidad =
  | { tipo: "guardada"; id: number }
  | { tipo: "no_encontrada" }
  | { tipo: "invalida"; errores: Record<string, string> };

export type ResultadoEstadoOportunidad =
  | { tipo: "aplicado"; estado: string }
  | { tipo: "no_encontrada" }
  | { tipo: "no_permitido"; mensaje: string };

export type ResultadoEliminacionOportunidad =
  { tipo: "eliminada" } | { tipo: "no_encontrada" } | { tipo: "no_permitida"; mensaje: string };

/**
 * Estados desde los que una convocatoria ya no vuelve a cambiar.
 *
 * Cancelada y finalizada son el final del recorrido: la primera porque la
 * actividad no se hizo y la segunda porque ya se hizo. Reabrir cualquiera de
 * las dos dejaría a la vista del estudiantado una convocatoria cuyo cupo y
 * cuyas horas ya se contaron.
 */
const ESTADOS_FINALES = ["CANCELADA", "FINALIZADA"] as const;

/**
 * Administración de las convocatorias para realizar horas beca.
 *
 * Sigue la misma separación entre servicio y repositorio que el resto del
 * proyecto: las reglas viven aquí y se prueban sin base de datos.
 *
 * Las dos reglas propias son que el estado cambia por su propia operación y no
 * al guardar los datos, y que una convocatoria con horas registradas no se
 * elimina: esas horas son el historial de quien ya apoyó, y borrar la
 * convocatoria las dejaría sin su origen. Para eso está cancelarla.
 */
export class ServicioOportunidades {
  constructor(private readonly repositorio: RepositorioOportunidades) {}

  /** Crea la convocatoria como borrador: todavía no se ve en el sitio. */
  async crear(datos: DatosOportunidadAdmin, creadoPor: number): Promise<ResultadoOportunidad> {
    const id = await this.repositorio.crear(aDatosPersistidos(datos), creadoPor);

    return { tipo: "guardada", id };
  }

  /**
   * Corrige los datos de una convocatoria sin tocar su estado.
   *
   * Una convocatoria cancelada o finalizada no se edita: su información es la
   * que vio quien se presentó, y cambiarla después reescribiría lo que ya pasó.
   */
  async editar(id: number, datos: DatosOportunidadAdmin): Promise<ResultadoOportunidad> {
    const actual = await this.repositorio.estadoActual(id);
    if (actual === null) return { tipo: "no_encontrada" };

    if (ESTADOS_FINALES.some((estado) => estado === actual.estado)) {
      return {
        tipo: "invalida",
        errores: {
          general: `Una convocatoria ${ETIQUETAS_ESTADO_OPORTUNIDAD[actual.estado].toLocaleLowerCase("es")} ya no se puede editar.`,
        },
      };
    }

    const actualizada = await this.repositorio.actualizar(id, aDatosPersistidos(datos));
    if (!actualizada) return { tipo: "no_encontrada" };

    return { tipo: "guardada", id };
  }

  /**
   * Publica, cierra, cancela o marca como finalizada una convocatoria.
   *
   * Es una operación aparte de la edición a propósito: así corregir una falta de
   * ortografía no puede publicar lo que todavía se estaba preparando.
   */
  async cambiarEstado(id: number, accion: AccionOportunidad): Promise<ResultadoEstadoOportunidad> {
    const actual = await this.repositorio.estadoActual(id);
    if (actual === null) return { tipo: "no_encontrada" };

    const destino = ESTADO_DE_ACCION[accion];

    if (actual.estado === destino) {
      return {
        tipo: "no_permitido",
        mensaje: `La convocatoria ya está ${ETIQUETAS_ESTADO_OPORTUNIDAD[destino].toLocaleLowerCase("es")}.`,
      };
    }
    if (ESTADOS_FINALES.some((estado) => estado === actual.estado)) {
      return {
        tipo: "no_permitido",
        mensaje: `Una convocatoria ${ETIQUETAS_ESTADO_OPORTUNIDAD[actual.estado].toLocaleLowerCase("es")} ya no cambia de estado.`,
      };
    }

    const aplicado = await this.repositorio.cambiarEstado(id, destino);
    if (!aplicado) return { tipo: "no_encontrada" };

    return { tipo: "aplicado", estado: destino };
  }

  /**
   * Elimina una convocatoria que nunca llegó a usarse.
   *
   * Con horas registradas no se elimina: se cancela. Es la misma idea que la
   * baja lógica de las organizaciones, y el motivo por el que el panel ofrece
   * las dos acciones por separado.
   */
  async eliminar(id: number): Promise<ResultadoEliminacionOportunidad> {
    const actual = await this.repositorio.estadoActual(id);
    if (actual === null) return { tipo: "no_encontrada" };

    if (actual.registros > 0) {
      return {
        tipo: "no_permitida",
        mensaje: `La convocatoria tiene ${actual.registros} ${actual.registros === 1 ? "registro" : "registros"} de horas asociados. Cancélala en lugar de eliminarla, para conservar el historial.`,
      };
    }

    const eliminada = await this.repositorio.eliminar(id);
    if (!eliminada) return { tipo: "no_encontrada" };

    return { tipo: "eliminada" };
  }
}
