import type { RepositorioEventosGuardados } from "@/lib/perfil/repositorio-eventos-guardados";

export type ResultadoGuardado =
  { tipo: "guardado" } | { tipo: "quitado" } | { tipo: "no_encontrado" };

/**
 * Eventos guardados por el estudiante.
 *
 * Solo se guardan eventos publicados: un borrador o un evento cancelado no
 * existen fuera del panel, así que tampoco pueden guardarse. Un evento que se
 * cancela después deja de aparecer entre los guardados sin que el estudiante
 * tenga que quitarlo, porque el listado vuelve a exigir que esté publicado.
 */
export class ServicioEventosGuardados {
  constructor(private readonly repositorio: RepositorioEventosGuardados) {}

  async guardar(idUsuario: number, idEvento: number): Promise<ResultadoGuardado> {
    if (!Number.isSafeInteger(idEvento) || idEvento <= 0) return { tipo: "no_encontrado" };
    if (!(await this.repositorio.eventoPublicado(idEvento))) return { tipo: "no_encontrado" };

    await this.repositorio.guardar(idUsuario, idEvento);

    return { tipo: "guardado" };
  }

  /**
   * Quita el evento de los guardados. No comprueba que el evento siga publicado:
   * si AEUVG lo canceló, el estudiante todavía debe poder quitarlo de su lista.
   */
  async quitar(idUsuario: number, idEvento: number): Promise<ResultadoGuardado> {
    if (!Number.isSafeInteger(idEvento) || idEvento <= 0) return { tipo: "no_encontrado" };

    const quitado = await this.repositorio.quitar(idUsuario, idEvento);

    return quitado ? { tipo: "quitado" } : { tipo: "no_encontrado" };
  }

  /** Cuáles de los eventos indicados tiene guardados el estudiante. */
  async idsGuardados(idUsuario: number, idsEventos: number[]): Promise<Set<number>> {
    return new Set(await this.repositorio.idsGuardados(idUsuario, idsEventos));
  }
}
