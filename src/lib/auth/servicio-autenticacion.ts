import { verificarContrasena } from "@/lib/auth/contrasenas";
import { puedeAutenticarse } from "@/lib/auth/politica-autenticacion";
import type {
  RepositorioAutenticacion,
  UsuarioAutenticacion,
  UsuarioSesion,
} from "@/lib/auth/repositorio-autenticacion";
import { validarTokenSesion } from "@/lib/auth/sesion";
import type { ConfiguracionSesion } from "@/lib/configuracion-sesion";
import type { DatosInicioSesion } from "@/validators/inicio-sesion";

// Evita que la ausencia de una cuenta reduzca apreciablemente el costo del intento.
const hashComparacionFalsa =
  "scrypt$16384$8$1$YWV1dmctcHJ1ZWJhLXNlZWQ$f2kV5H9V6EjELwbMWgSV9tyWyrPFDtvBK5NYgl54i18QZvWR-RQANGelMo7wLABpwFvh2BBIy_FiT7YN1Kc3YQ";

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
      usuario?.contrasenaHash ?? hashComparacionFalsa
    );

    if (!usuario || !contrasenaCorrecta) {
      return { tipo: "credenciales_invalidas" };
    }
    if (!puedeAutenticarse(usuario)) return { tipo: "correo_no_verificado" };

    await this.repositorio.registrarAcceso(usuario.idUsuario, this.ahora());
    return { tipo: "autenticado", usuario };
  }

  async obtenerUsuarioSesion(token: string | undefined): Promise<UsuarioSesion | null> {
    const datosSesion = await validarTokenSesion(token, this.configuracionSesion, this.ahora());
    if (!datosSesion) return null;

    const usuario = await this.repositorio.buscarPorId(datosSesion.idUsuario);
    return usuario && puedeAutenticarse(usuario) ? usuario : null;
  }
}
