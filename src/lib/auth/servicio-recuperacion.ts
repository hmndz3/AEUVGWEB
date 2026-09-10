import { crearHashContrasena } from "@/lib/auth/contrasenas";
import type { RepositorioRecuperacion } from "@/lib/auth/repositorio-recuperacion";
import {
  calcularExpiracion,
  crearHashToken,
  crearTokenVerificacion,
} from "@/lib/auth/tokens-verificacion";
import type { ProveedorCorreo } from "@/lib/correo/proveedor-correo";
import { enviarCorreoRecuperacion } from "@/lib/correo/recuperacion-contrasena";

export type ConfiguracionServicioRecuperacion = {
  urlAplicacion: string;
  minutosVigenciaToken: number;
  segundosEsperaReenvio: number;
  maximosEnviosPorHora: number;
};

export type ResultadoRestablecer = { tipo: "restablecida" } | { tipo: "token_invalido" };

export class ServicioRecuperacion {
  constructor(
    private readonly repositorio: RepositorioRecuperacion,
    private readonly proveedorCorreo: ProveedorCorreo,
    private readonly configuracion: ConfiguracionServicioRecuperacion,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  /**
   * Solicita el enlace de recuperación. No informa si la cuenta existe: siempre
   * termina sin error para no revelar qué correos están registrados.
   */
  async solicitar(correo: string): Promise<void> {
    const fecha = this.ahora();
    const { token, tokenHash } = crearTokenVerificacion();

    const cuenta = await this.repositorio.prepararRecuperacion({
      correo,
      tokenHash,
      fechaExpiracion: calcularExpiracion(fecha, this.configuracion.minutosVigenciaToken),
      fecha,
      segundosEspera: this.configuracion.segundosEsperaReenvio,
      maximosPorHora: this.configuracion.maximosEnviosPorHora,
    });

    if (!cuenta) return;

    try {
      await enviarCorreoRecuperacion({
        proveedor: this.proveedorCorreo,
        destinatario: cuenta.correo,
        nombre: cuenta.nombreCompleto,
        token,
        urlAplicacion: this.configuracion.urlAplicacion,
        minutosVigencia: this.configuracion.minutosVigenciaToken,
      });
    } catch {
      // El fallo de envío no debe revelar el estado de la cuenta al solicitante.
    }
  }

  async restablecer(token: string, contrasenaNueva: string): Promise<ResultadoRestablecer> {
    const contrasenaHash = await crearHashContrasena(contrasenaNueva);
    const restablecida = await this.repositorio.restablecerContrasena({
      tokenHash: crearHashToken(token),
      contrasenaHash,
      fecha: this.ahora(),
    });

    return restablecida ? { tipo: "restablecida" } : { tipo: "token_invalido" };
  }
}
