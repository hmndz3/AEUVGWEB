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

/**
 * Evita que la ausencia de una cuenta reduzca el costo del intento. Debe ser un
 * hash con el formato exacto que produce el registro: si no lo fuera, la
 * verificación saldría antes de derivar la clave y un correo inexistente
 * respondería más rápido que uno existente.
 */
export const HASH_COMPARACION_FALSA =
  "scrypt$16384$8$1$YWV1dmctc2VlZC1sb2NhbA$rX7fh4FCeJzlk55DZnj96avxeBrKPrlrSjNaBDEXQFW1m5gmXtsJBk3LGxFnRZfiuaVyAx6BiA6UE07nkK8V_Q";

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
    return { tipo: "autenticado", usuario };
  }

  async obtenerUsuarioSesion(token: string | undefined): Promise<UsuarioSesion | null> {
    const datosSesion = await validarTokenSesion(token, this.configuracionSesion, this.ahora());
    if (!datosSesion) return null;

    const usuario = await this.repositorio.buscarPorId(datosSesion.idUsuario);
    return usuario && puedeAutenticarse(usuario) ? usuario : null;
  }
}
