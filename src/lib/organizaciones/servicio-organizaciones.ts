import {
  textoDeBusquedaAsociacion,
  textoDeBusquedaClub,
} from "@/lib/organizaciones/busqueda-organizaciones";
import type {
  DatosAsociacionPersistidos,
  DatosClubPersistidos,
  RepositorioOrganizaciones,
} from "@/lib/organizaciones/repositorio-organizaciones";
import {
  ETIQUETA_TIPO,
  type DatosAsociacionAdmin,
  type DatosClubAdmin,
  type EntradaOrganizacion,
  type TipoOrganizacion,
} from "@/validators/organizacion-admin";

export type ResultadoOrganizacion =
  | { tipo: "guardada"; id: number }
  | { tipo: "no_encontrada" }
  | { tipo: "invalida"; errores: Record<string, string> };

export type ResultadoEstado = { tipo: "aplicado"; activo: boolean } | { tipo: "no_encontrada" };

export type ResultadoEliminacion =
  { tipo: "eliminada" } | { tipo: "no_encontrada" } | { tipo: "no_permitida"; mensaje: string };

const MENSAJE_NOMBRE_REPETIDO = "Ya existe un registro con ese nombre.";

function aDatosAsociacion(datos: DatosAsociacionAdmin): DatosAsociacionPersistidos {
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

function aDatosClub(datos: DatosClubAdmin): DatosClubPersistidos {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    actividades: datos.actividades,
    correo: datos.correo,
    informacionContacto: datos.informacionContacto,
    imagenUrl: datos.imagenUrl,
    textoBusqueda: textoDeBusquedaClub(datos),
  };
}

/**
 * Administración de las asociaciones y los clubes del campus.
 *
 * Sigue la misma separación entre servicio y repositorio que la autenticación y
 * los eventos: las reglas viven aquí y pueden probarse sin base de datos, y el
 * acceso a datos queda detrás de la interfaz del repositorio.
 *
 * Las operaciones reciben el tipo en una entrada discriminada en lugar de
 * duplicarse por entidad: las reglas son las mismas y lo único que cambia son
 * los campos propios de cada ficha.
 */
export class ServicioOrganizaciones {
  constructor(private readonly repositorio: RepositorioOrganizaciones) {}

  async crear(entrada: EntradaOrganizacion): Promise<ResultadoOrganizacion> {
    const disponible = await this.repositorio.nombreDisponible(
      entrada.tipo,
      entrada.datos.nombre,
      null
    );
    if (!disponible) return { tipo: "invalida", errores: { nombre: MENSAJE_NOMBRE_REPETIDO } };

    const id =
      entrada.tipo === "asociaciones"
        ? await this.repositorio.crearAsociacion(aDatosAsociacion(entrada.datos))
        : await this.repositorio.crearClub(aDatosClub(entrada.datos));

    return { tipo: "guardada", id };
  }

  async editar(id: number, entrada: EntradaOrganizacion): Promise<ResultadoOrganizacion> {
    const disponible = await this.repositorio.nombreDisponible(
      entrada.tipo,
      entrada.datos.nombre,
      id
    );
    if (!disponible) return { tipo: "invalida", errores: { nombre: MENSAJE_NOMBRE_REPETIDO } };

    const actualizada =
      entrada.tipo === "asociaciones"
        ? await this.repositorio.actualizarAsociacion(id, aDatosAsociacion(entrada.datos))
        : await this.repositorio.actualizarClub(id, aDatosClub(entrada.datos));

    return actualizada ? { tipo: "guardada", id } : { tipo: "no_encontrada" };
  }

  /**
   * Da de baja o reactiva una organización. La baja es lógica porque un grupo
   * puede haber organizado eventos que forman parte del historial de AEUVG:
   * retirarlo de las pantallas públicas no debe borrar ese pasado.
   */
  async cambiarEstado(
    tipo: TipoOrganizacion,
    id: number,
    activo: boolean
  ): Promise<ResultadoEstado> {
    const aplicado = await this.repositorio.cambiarEstado(tipo, id, activo);

    return aplicado ? { tipo: "aplicado", activo } : { tipo: "no_encontrada" };
  }

  /**
   * Elimina una organización de forma definitiva. Solo se permite mientras no
   * organice ningún evento: la tabla de organizadores restringe el borrado y, sin
   * esta comprobación, el panel respondería con un error de la base en lugar de
   * explicar que corresponde darla de baja.
   */
  async eliminar(tipo: TipoOrganizacion, id: number): Promise<ResultadoEliminacion> {
    const organizacion = await this.repositorio.obtener(tipo, id);
    if (!organizacion) return { tipo: "no_encontrada" };

    if (await this.repositorio.organizaEventos(tipo, id)) {
      const { singular } = ETIQUETA_TIPO[tipo];
      return {
        tipo: "no_permitida",
        mensaje: `Esta ${singular} organiza eventos registrados; dala de baja para retirarla del sitio sin borrar su historial.`,
      };
    }

    const eliminada = await this.repositorio.eliminar(tipo, id);

    return eliminada ? { tipo: "eliminada" } : { tipo: "no_encontrada" };
  }

  async obtener(tipo: TipoOrganizacion, id: number) {
    return this.repositorio.obtener(tipo, id);
  }
}
