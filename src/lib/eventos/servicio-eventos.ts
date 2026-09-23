import type { EstadoEvento } from "@prisma/client";

import { textoDeBusqueda } from "@/lib/eventos/busqueda";
import type {
  DatosEventoPersistidos,
  OrganizadorNuevo,
  RepositorioEventos,
} from "@/lib/eventos/repositorio-eventos";
import type { DatosEventoAdmin } from "@/validators/evento-admin";

export type ResultadoEvento =
  | { tipo: "guardado"; idEvento: number }
  | { tipo: "no_encontrado" }
  | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoTransicion =
  | { tipo: "aplicada"; estado: EstadoEvento }
  | { tipo: "no_encontrado" }
  | { tipo: "no_permitida"; mensaje: string };

export type ResultadoEliminacion =
  { tipo: "eliminada" } | { tipo: "no_encontrado" } | { tipo: "no_permitida"; mensaje: string };

/**
 * Arma la lista de organizadores a partir del formulario.
 *
 * Cada fila de organizador guarda una sola referencia (asociación, club o
 * unidad de UVG), tal como exige la restricción de la tabla. El primero que se
 * indica queda como principal, que es el que encabeza la tarjeta del evento.
 */
export function construirOrganizadores(datos: DatosEventoAdmin): OrganizadorNuevo[] {
  const organizadores: OrganizadorNuevo[] = [];

  if (datos.idAsociacion) {
    organizadores.push({
      idAsociacion: datos.idAsociacion,
      idClub: null,
      unidadUvg: null,
      organizadorPrincipal: false,
    });
  }
  if (datos.idClub) {
    organizadores.push({
      idAsociacion: null,
      idClub: datos.idClub,
      unidadUvg: null,
      organizadorPrincipal: false,
    });
  }
  if (datos.unidadUvg) {
    organizadores.push({
      idAsociacion: null,
      idClub: null,
      unidadUvg: datos.unidadUvg,
      organizadorPrincipal: false,
    });
  }

  if (organizadores.length > 0) organizadores[0].organizadorPrincipal = true;

  return organizadores;
}

function aDatosPersistidos(datos: DatosEventoAdmin): DatosEventoPersistidos {
  return {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    idCategoriaEvento: datos.idCategoriaEvento,
    tipoActividad: datos.tipoActividad,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    ubicacion: datos.ubicacion,
    cupo: datos.cupo,
    informacionAdicional: datos.informacionAdicional,
    imagenUrl: datos.imagenUrl,
    destacado: datos.destacado,
    // Se recalcula en cada guardado para que el buscador nunca quede desfasado.
    textoBusqueda: textoDeBusqueda(datos),
  };
}

export class ServicioEventos {
  constructor(private readonly repositorio: RepositorioEventos) {}

  /** Comprueba contra la base lo que el esquema no puede saber por sí solo. */
  private async validarReferencias(datos: DatosEventoAdmin): Promise<Record<string, string>> {
    const errores: Record<string, string> = {};

    const [categoriaValida, organizadoresValidos] = await Promise.all([
      this.repositorio.categoriaActiva(datos.idCategoriaEvento),
      this.repositorio.organizadoresExisten(datos.idAsociacion, datos.idClub),
    ]);

    if (!categoriaValida) errores.idCategoriaEvento = "La categoría seleccionada no existe.";
    if (!organizadoresValidos) {
      errores.idAsociacion = "El organizador seleccionado no existe o está inactivo.";
    }

    return errores;
  }

  async crear(datos: DatosEventoAdmin, creadoPor: number): Promise<ResultadoEvento> {
    const errores = await this.validarReferencias(datos);
    if (Object.keys(errores).length > 0) return { tipo: "invalido", errores };

    const idEvento = await this.repositorio.crear(
      aDatosPersistidos(datos),
      construirOrganizadores(datos),
      creadoPor
    );

    return { tipo: "guardado", idEvento };
  }

  async editar(idEvento: number, datos: DatosEventoAdmin): Promise<ResultadoEvento> {
    const errores = await this.validarReferencias(datos);
    if (Object.keys(errores).length > 0) return { tipo: "invalido", errores };

    const actualizado = await this.repositorio.actualizar(
      idEvento,
      aDatosPersistidos(datos),
      construirOrganizadores(datos)
    );

    return actualizado ? { tipo: "guardado", idEvento } : { tipo: "no_encontrado" };
  }

  /**
   * Publica un evento. Un evento que ya terminó no vuelve a la cartelera: si
   * AEUVG quiere repetir la actividad, corresponde crear una nueva con sus
   * propias fechas, no revivir la anterior.
   */
  async publicar(idEvento: number): Promise<ResultadoTransicion> {
    const evento = await this.repositorio.obtener(idEvento);
    if (!evento) return { tipo: "no_encontrado" };

    if (evento.estado === "FINALIZADO") {
      return {
        tipo: "no_permitida",
        mensaje: "Un evento finalizado no puede volver a publicarse; crea uno nuevo.",
      };
    }

    if (evento.estado === "PUBLICADO") return { tipo: "aplicada", estado: "PUBLICADO" };

    await this.repositorio.cambiarEstado(idEvento, "PUBLICADO");

    return { tipo: "aplicada", estado: "PUBLICADO" };
  }

  /** Cancela un evento: deja de verse en el listado público y en el calendario. */
  async cancelar(idEvento: number): Promise<ResultadoTransicion> {
    const evento = await this.repositorio.obtener(idEvento);
    if (!evento) return { tipo: "no_encontrado" };

    if (evento.estado === "FINALIZADO") {
      return { tipo: "no_permitida", mensaje: "Un evento finalizado ya no puede cancelarse." };
    }

    await this.repositorio.cambiarEstado(idEvento, "CANCELADO");

    return { tipo: "aplicada", estado: "CANCELADO" };
  }

  /**
   * Elimina un evento. Solo se permite mientras no haya empezado: una vez que
   * la actividad ocurrió forma parte del historial de AEUVG y puede estar
   * referenciada por los eventos guardados de los estudiantes. Para retirarla
   * de la vista está la cancelación.
   */
  async eliminar(idEvento: number, ahora = new Date()): Promise<ResultadoEliminacion> {
    const evento = await this.repositorio.obtener(idEvento);
    if (!evento) return { tipo: "no_encontrado" };

    if (evento.estado === "PUBLICADO" && evento.fechaInicio.getTime() <= ahora.getTime()) {
      return {
        tipo: "no_permitida",
        mensaje: "Un evento publicado que ya inició no se elimina; cancélalo para retirarlo.",
      };
    }

    const eliminado = await this.repositorio.eliminar(idEvento);

    return eliminado ? { tipo: "eliminada" } : { tipo: "no_encontrado" };
  }

  async obtener(idEvento: number) {
    return this.repositorio.obtener(idEvento);
  }
}
