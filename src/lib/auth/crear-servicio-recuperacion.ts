import { RepositorioRecuperacionPrisma } from "@/lib/auth/repositorio-recuperacion";
import { ServicioRecuperacion } from "@/lib/auth/servicio-recuperacion";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { obtenerProveedorCorreo } from "@/lib/correo/proveedor-correo";

/**
 * La recuperación reutiliza la configuración de vigencia y límites del registro:
 * ambos flujos envían un enlace temporal de un solo uso al correo institucional.
 */
export function crearServicioRecuperacion(): ServicioRecuperacion {
  const configuracion = obtenerConfiguracionRegistro();

  return new ServicioRecuperacion(new RepositorioRecuperacionPrisma(), obtenerProveedorCorreo(), {
    urlAplicacion: configuracion.urlAplicacion,
    minutosVigenciaToken: configuracion.minutosVigenciaToken,
    segundosEsperaReenvio: configuracion.segundosEsperaReenvio,
    maximosEnviosPorHora: configuracion.maximosReenviosPorHora,
  });
}
