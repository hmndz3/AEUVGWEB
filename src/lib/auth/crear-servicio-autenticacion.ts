import { RepositorioAutenticacionPrisma } from "@/lib/auth/repositorio-autenticacion";
import { ServicioAutenticacion } from "@/lib/auth/servicio-autenticacion";
import { obtenerConfiguracionSesion } from "@/lib/configuracion-sesion";

export function crearServicioAutenticacion(): ServicioAutenticacion {
  return new ServicioAutenticacion(
    new RepositorioAutenticacionPrisma(),
    obtenerConfiguracionSesion()
  );
}
