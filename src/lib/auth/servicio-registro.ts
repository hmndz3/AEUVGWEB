import { crearHashContrasena } from "@/lib/auth/contrasenas";
import type { RepositorioRegistro, ResultadoCrearCuenta } from "@/lib/auth/repositorio-registro";
import {
  calcularExpiracion,
  crearHashToken,
  crearTokenVerificacion,
} from "@/lib/auth/tokens-verificacion";
import type { ProveedorCorreo } from "@/lib/correo/proveedor-correo";
import { enviarCorreoVerificacion } from "@/lib/correo/verificacion-correo";
import type { DatosRegistro } from "@/validators/registro";

export type ConfiguracionServicioRegistro = {
  urlAplicacion: string;
  minutosVigenciaToken: number;
  segundosEsperaReenvio: number;
  maximosReenviosPorHora: number;
};

export class ServicioRegistro {
  constructor(
    private readonly repositorio: RepositorioRegistro,
    private readonly proveedorCorreo: ProveedorCorreo,
    private readonly configuracion: ConfiguracionServicioRegistro,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async registrar(
    datos: DatosRegistro
  ): Promise<ResultadoCrearCuenta & { correoEnviado?: boolean }> {
    const fecha = this.ahora();
    const [{ token, tokenHash }, contrasenaHash] = await Promise.all([
      Promise.resolve(crearTokenVerificacion()),
      crearHashContrasena(datos.contrasena),
    ]);
    const resultado = await this.repositorio.crearCuenta({
      nombreCompleto: datos.nombreCompleto,
      carnet: datos.carnet,
      correo: datos.correo,
      idFacultad: datos.idFacultad,
      idCarrera: datos.idCarrera,
      contrasenaHash,
      tokenHash,
      fechaExpiracion: calcularExpiracion(fecha, this.configuracion.minutosVigenciaToken),
    });

    if (resultado.tipo !== "creada") return resultado;

    try {
      await enviarCorreoVerificacion({
        proveedor: this.proveedorCorreo,
        destinatario: resultado.cuenta.correo,
        nombre: resultado.cuenta.nombreCompleto,
        token,
        urlAplicacion: this.configuracion.urlAplicacion,
        minutosVigencia: this.configuracion.minutosVigenciaToken,
      });
      return { ...resultado, correoEnviado: true };
    } catch {
      return { ...resultado, correoEnviado: false };
    }
  }

  async verificar(token: string): Promise<boolean> {
    return this.repositorio.consumirToken(crearHashToken(token), this.ahora());
  }

  async reenviar(correo: string): Promise<void> {
    const fecha = this.ahora();
    const { token, tokenHash } = crearTokenVerificacion();
    const cuenta = await this.repositorio.prepararReenvio({
      correo,
      tokenHash,
      fechaExpiracion: calcularExpiracion(fecha, this.configuracion.minutosVigenciaToken),
      fecha,
      segundosEspera: this.configuracion.segundosEsperaReenvio,
      maximosPorHora: this.configuracion.maximosReenviosPorHora,
    });

    if (!cuenta) return;

    try {
      await enviarCorreoVerificacion({
        proveedor: this.proveedorCorreo,
        destinatario: cuenta.correo,
        nombre: cuenta.nombreCompleto,
        token,
        urlAplicacion: this.configuracion.urlAplicacion,
        minutosVigencia: this.configuracion.minutosVigenciaToken,
      });
    } catch {
      // La respuesta pública permanece uniforme para impedir enumeración de cuentas.
    }
  }
}
