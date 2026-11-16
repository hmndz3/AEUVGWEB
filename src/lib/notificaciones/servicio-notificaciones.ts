export interface RepositorioNotificaciones {
  /** Marca como leída la notificación indicada, solo si es de esa cuenta. */
  marcarLeida(idNotificacion: number, idUsuario: number, ahora: Date): Promise<boolean>;
  /** Marca todas las no leídas de la cuenta y devuelve cuántas cambiaron. */
  marcarTodas(idUsuario: number, ahora: Date): Promise<number>;
}

export type ResultadoLectura = { tipo: "leida" } | { tipo: "no_encontrada" };

/**
 * Lectura de las notificaciones.
 *
 * Marcar como leída se resuelve siempre contra la cuenta de la sesión: una
 * notificación ajena responde como no encontrada en lugar de rechazarse, para
 * no confirmar que existe.
 */
export class ServicioNotificaciones {
  constructor(
    private readonly repositorio: RepositorioNotificaciones,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async marcarLeida(idNotificacion: number, idUsuario: number): Promise<ResultadoLectura> {
    const aplicado = await this.repositorio.marcarLeida(idNotificacion, idUsuario, this.ahora());

    return aplicado ? { tipo: "leida" } : { tipo: "no_encontrada" };
  }

  async marcarTodas(idUsuario: number): Promise<number> {
    return this.repositorio.marcarTodas(idUsuario, this.ahora());
  }
}
