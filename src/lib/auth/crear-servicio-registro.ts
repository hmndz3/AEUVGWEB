import { RepositorioRegistroPrisma } from "@/lib/auth/repositorio-registro";
import { ServicioRegistro } from "@/lib/auth/servicio-registro";
import { obtenerConfiguracionRegistro } from "@/lib/configuracion-registro";
import { obtenerProveedorCorreo } from "@/lib/correo/proveedor-correo";

export function crearServicioRegistro(): ServicioRegistro {
  const configuracion = obtenerConfiguracionRegistro();

  return new ServicioRegistro(
    new RepositorioRegistroPrisma(),
    obtenerProveedorCorreo(),
    configuracion
  );
}
