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
  type DatosIntegranteAdmin,
  type DatosRedSocialAdmin,
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
const MENSAJE_SIGLAS_REPETIDAS = "Ya existe una asociación con esas siglas.";

function aDatosAsociacion(datos: DatosAsociacionAdmin): DatosAsociacionPersistidos {
  return {
    nombre: datos.nombre,
    siglas: datos.siglas,
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

    const siglasRepetidas = await this.siglasRepetidas(entrada, null);
    if (siglasRepetidas) return siglasRepetidas;

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

    const siglasRepetidas = await this.siglasRepetidas(entrada, id);
    if (siglasRepetidas) return siglasRepetidas;

    const actualizada =
      entrada.tipo === "asociaciones"
        ? await this.repositorio.actualizarAsociacion(id, aDatosAsociacion(entrada.datos))
        : await this.repositorio.actualizarClub(id, aDatosClub(entrada.datos));

    return actualizada ? { tipo: "guardada", id } : { tipo: "no_encontrada" };
  }

  /**
   * Las siglas también identifican a la asociación, así que dos no pueden
   * compartirlas. Se comprueba antes de guardar para responder con el error en
   * el campo, en lugar de con el de la restricción de la tabla.
   */
  private async siglasRepetidas(
    entrada: EntradaOrganizacion,
    excepto: number | null
  ): Promise<ResultadoOrganizacion | null> {
    if (entrada.tipo !== "asociaciones" || entrada.datos.siglas === null) return null;

    const disponibles = await this.repositorio.siglasDisponibles(entrada.datos.siglas, excepto);

    return disponibles ? null : { tipo: "invalida", errores: { siglas: MENSAJE_SIGLAS_REPETIDAS } };
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

  /**
   * Registra o actualiza un integrante de la junta directiva. La asociación se
   * comprueba antes para no crear integrantes huérfanos cuando la dirección
   * apunta a una ficha que ya no existe.
   */
  async guardarIntegrante(
    idAsociacion: number,
    datos: DatosIntegranteAdmin,
    idIntegrante: number | null = null
  ): Promise<ResultadoOrganizacion> {
    const asociacion = await this.repositorio.obtener("asociaciones", idAsociacion);
    if (!asociacion) return { tipo: "no_encontrada" };

    if (idIntegrante === null) {
      const id = await this.repositorio.crearIntegrante(idAsociacion, datos);
      return { tipo: "guardada", id };
    }

    const actualizado = await this.repositorio.actualizarIntegrante(
      idAsociacion,
      idIntegrante,
      datos
    );

    return actualizado ? { tipo: "guardada", id: idIntegrante } : { tipo: "no_encontrada" };
  }

  /**
   * Quita un integrante. El borrado sí es definitivo: un integrante no tiene
   * historial propio que preservar, y la junta anterior se conserva registrando
   * su periodo en los integrantes que la formaron.
   */
  async eliminarIntegrante(
    idAsociacion: number,
    idIntegrante: number
  ): Promise<ResultadoEliminacion> {
    const eliminado = await this.repositorio.eliminarIntegrante(idAsociacion, idIntegrante);

    return eliminado ? { tipo: "eliminada" } : { tipo: "no_encontrada" };
  }

  async listarIntegrantes(idAsociacion: number) {
    return this.repositorio.listarIntegrantes(idAsociacion);
  }

  /**
   * Agrega una red social. La tabla tiene una restricción de unicidad por
   * plataforma y enlace, así que el duplicado se detecta antes de intentar
   * guardarlo: de otro modo el panel mostraría un error de la base.
   */
  async agregarRedSocial(
    tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<ResultadoOrganizacion> {
    const organizacion = await this.repositorio.obtener(tipo, id);
    if (!organizacion) return { tipo: "no_encontrada" };

    if (await this.repositorio.redSocialRegistrada(tipo, id, datos)) {
      return { tipo: "invalida", errores: { url: "Ese enlace ya está registrado." } };
    }

    const idRedSocial = await this.repositorio.crearRedSocial(tipo, id, datos);

    return { tipo: "guardada", id: idRedSocial };
  }

  async eliminarRedSocial(
    tipo: TipoOrganizacion,
    id: number,
    idRedSocial: number
  ): Promise<ResultadoEliminacion> {
    const eliminada = await this.repositorio.eliminarRedSocial(tipo, id, idRedSocial);

    return eliminada ? { tipo: "eliminada" } : { tipo: "no_encontrada" };
  }

  async listarRedesSociales(tipo: TipoOrganizacion, id: number) {
    return this.repositorio.listarRedesSociales(tipo, id);
  }
}
