import type { EstadoCuenta } from "@/validators/cuentas-admin";

export interface RepositorioCuentas {
  /** El estado actual de la cuenta, o null si no existe. */
  estadoDe(idUsuario: number): Promise<EstadoCuenta | null>;
  cambiarEstado(idUsuario: number, estado: EstadoCuenta): Promise<boolean>;
}

export type ResultadoEstadoCuenta =
  | { tipo: "aplicado"; estado: EstadoCuenta }
  | { tipo: "no_encontrada" }
  | { tipo: "no_permitido"; mensaje: string };

/**
 * Estado de las cuentas del estudiantado.
 *
 * La regla propia es que un administrador no puede bloquear su propia cuenta.
 * No es una cortesía: bloquearse a uno mismo cierra la sesión y deja el panel
 * sin quien lo administre, y recuperarlo exigiría entrar a la base a mano.
 */
export class ServicioCuentas {
  constructor(private readonly repositorio: RepositorioCuentas) {}

  async cambiarEstado(
    idUsuario: number,
    estado: EstadoCuenta,
    idAdministrador: number
  ): Promise<ResultadoEstadoCuenta> {
    if (idUsuario === idAdministrador && estado !== "ACTIVO") {
      return {
        tipo: "no_permitido",
        mensaje:
          "No puedes bloquear tu propia cuenta: te quedarías fuera del panel y habría que entrar a la base para devolverte el acceso.",
      };
    }

    const actual = await this.repositorio.estadoDe(idUsuario);
    if (actual === null) return { tipo: "no_encontrada" };

    if (actual === estado) {
      return { tipo: "no_permitido", mensaje: "La cuenta ya está en ese estado." };
    }

    const aplicado = await this.repositorio.cambiarEstado(idUsuario, estado);

    return aplicado ? { tipo: "aplicado", estado } : { tipo: "no_encontrada" };
  }
}
