import {
  crearHashContrasena,
  necesitaRehacerse,
  verificarContrasena,
} from "@/lib/auth/contrasenas";
import { puedeAutenticarse } from "@/lib/auth/politica-autenticacion";
import type {
  RepositorioAutenticacion,
  UsuarioAutenticacion,
  UsuarioSesion,
} from "@/lib/auth/repositorio-autenticacion";
import { validarTokenSesion } from "@/lib/auth/sesion";
import type { ConfiguracionSesion } from "@/lib/configuracion-sesion";
import type { DatosInicioSesion } from "@/validators/inicio-sesion";

/**
 * Evita que la ausencia de una cuenta reduzca el costo del intento.
 *
 * Tiene que llevar los parámetros vigentes: si fueran más flojos, derivarlo
 * costaría menos que derivar uno real y un correo inexistente respondería
 * antes que uno existente, que es justamente lo que permite averiguar qué
 * cuentas existen. La prueba de autenticacion.test.ts lo comprueba.
 */
export const HASH_COMPARACION_FALSA =
  "scrypt$16384$8$5$2MCOC6JJz_FhxxWxePcfPA$eFi3Wmy5y7h5S2Ze2KIeX3ih2fqTuJv3fLpw7vqJDpKWyTCxNNKRfxTujJz8GenAjVUmR3V1mbFxKsM1jaZ9FQ";

export type ResultadoInicioSesion =
  | { tipo: "autenticado"; usuario: UsuarioAutenticacion }
  | { tipo: "credenciales_invalidas" }
  | { tipo: "correo_no_verificado" };

export class ServicioAutenticacion {
  constructor(
    private readonly repositorio: RepositorioAutenticacion,
    private readonly configuracionSesion: ConfiguracionSesion,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async iniciarSesion(datos: DatosInicioSesion): Promise<ResultadoInicioSesion> {
    const usuario = await this.repositorio.buscarPorCorreo(datos.correo);

    const contrasenaCorrecta = await verificarContrasena(
      datos.contrasena,
      usuario?.contrasenaHash ?? HASH_COMPARACION_FALSA
    );

    if (!usuario || !contrasenaCorrecta) {
      return { tipo: "credenciales_invalidas" };
    }
    if (!puedeAutenticarse(usuario)) return { tipo: "correo_no_verificado" };

    await this.repositorio.registrarAcceso(usuario.idUsuario, this.ahora());
    await this.rehacerHashSiHaceFalta(usuario, datos.contrasena);

    return { tipo: "autenticado", usuario };
  }

  /**
   * Vuelve a derivar la contraseña con el costo de hoy cuando el hash guardado
   * usa parámetros más flojos. Es el único momento en que se tiene la
   * contraseña en claro, así que es el único en que se puede hacer sin pedirle
   * nada a la persona. Si falla, el acceso sigue adelante: el hash viejo no es
   * inseguro, solo más barato de atacar.
   */
  private async rehacerHashSiHaceFalta(
    usuario: UsuarioAutenticacion,
    contrasena: string
  ): Promise<void> {
    if (!necesitaRehacerse(usuario.contrasenaHash)) return;

    try {
      await this.repositorio.actualizarHashContrasena(
        usuario.idUsuario,
        await crearHashContrasena(contrasena)
      );
    } catch {
      // Se reintentará en el siguiente acceso.
    }
  }

  async obtenerUsuarioSesion(token: string | undefined): Promise<UsuarioSesion | null> {
    const datosSesion = await validarTokenSesion(token, this.configuracionSesion, this.ahora());
    if (!datosSesion) return null;

    const usuario = await this.repositorio.buscarPorId(datosSesion.idUsuario);
    return usuario && puedeAutenticarse(usuario) ? usuario : null;
  }
}
