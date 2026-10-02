import { textoDeBusquedaAsociacion } from "@/lib/organizaciones/busqueda-organizaciones";
import type {
  DatosAsociacionPersistidos,
  RepositorioOrganizaciones,
} from "@/lib/organizaciones/repositorio-organizaciones";
import type { DatosAsociacionAdmin } from "@/validators/organizacion-admin";

export type ResultadoOrganizacion =
  | { tipo: "guardada"; id: number }
  | { tipo: "no_encontrada" }
  | { tipo: "invalida"; errores: Record<string, string> };

export type ResultadoEstado = { tipo: "aplicado"; activo: boolean } | { tipo: "no_encontrada" };

export type ResultadoEliminacion =
  { tipo: "eliminada" } | { tipo: "no_encontrada" } | { tipo: "no_permitida"; mensaje: string };

const MENSAJE_NOMBRE_REPETIDO = "Ya existe una organización registrada con ese nombre.";

function aDatosPersistidos(datos: DatosAsociacionAdmin): DatosAsociacionPersistidos {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    mision: datos.mision,
    vision: datos.vision,
    correo: datos.correo,
    informacionContacto: datos.informacionContacto,
    imagenUrl: datos.imagenUrl,
    // Se recalcula en cada guardado para que el buscador nunca quede desfasado.
    textoBusqueda: textoDeBusquedaAsociacion(datos),
  };
}

/**
 * Administración de las asociaciones y los clubes del campus.
 *
 * Sigue la misma separación entre servicio y repositorio que la autenticación y
 * los eventos: las reglas viven aquí y pueden probarse sin base de datos, y el
 * acceso a datos queda detrás de la interfaz del repositorio.
 */
export class ServicioOrganizaciones {
  constructor(private readonly repositorio: RepositorioOrganizaciones) {}

  async crearAsociacion(datos: DatosAsociacionAdmin): Promise<ResultadoOrganizacion> {
    const disponible = await this.repositorio.nombreAsociacionDisponible(datos.nombre, null);
    if (!disponible) return { tipo: "invalida", errores: { nombre: MENSAJE_NOMBRE_REPETIDO } };

    const id = await this.repositorio.crearAsociacion(aDatosPersistidos(datos));

    return { tipo: "guardada", id };
  }

  async editarAsociacion(
    idAsociacion: number,
    datos: DatosAsociacionAdmin
  ): Promise<ResultadoOrganizacion> {
    const disponible = await this.repositorio.nombreAsociacionDisponible(
      datos.nombre,
      idAsociacion
    );
    if (!disponible) return { tipo: "invalida", errores: { nombre: MENSAJE_NOMBRE_REPETIDO } };

    const actualizada = await this.repositorio.actualizarAsociacion(
      idAsociacion,
      aDatosPersistidos(datos)
    );

    return actualizada ? { tipo: "guardada", id: idAsociacion } : { tipo: "no_encontrada" };
  }

  /**
   * Da de baja o reactiva una asociación. La baja es lógica porque una
   * asociación puede haber organizado eventos que forman parte del historial de
   * AEUVG: retirarla de las pantallas públicas no debe borrar ese pasado.
   */
  async cambiarEstadoAsociacion(idAsociacion: number, activo: boolean): Promise<ResultadoEstado> {
    const aplicado = await this.repositorio.cambiarEstadoAsociacion(idAsociacion, activo);

    return aplicado ? { tipo: "aplicado", activo } : { tipo: "no_encontrada" };
  }

  /**
   * Elimina una asociación de forma definitiva. Solo se permite mientras no
   * organice ningún evento: la tabla de organizadores restringe el borrado y, sin
   * esta comprobación, el panel respondería con un error de la base en lugar de
   * explicar que corresponde darla de baja.
   */
  async eliminarAsociacion(idAsociacion: number): Promise<ResultadoEliminacion> {
    const asociacion = await this.repositorio.obtenerAsociacion(idAsociacion);
    if (!asociacion) return { tipo: "no_encontrada" };

    if (await this.repositorio.asociacionOrganizaEventos(idAsociacion)) {
      return {
        tipo: "no_permitida",
        mensaje:
          "Esta asociación organiza eventos registrados; dala de baja para retirarla del sitio sin borrar su historial.",
      };
    }

    const eliminada = await this.repositorio.eliminarAsociacion(idAsociacion);

    return eliminada ? { tipo: "eliminada" } : { tipo: "no_encontrada" };
  }

  async obtenerAsociacion(idAsociacion: number) {
    return this.repositorio.obtenerAsociacion(idAsociacion);
  }
}
