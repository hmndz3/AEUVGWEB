import { RepositorioEventosGuardadosPrisma } from "@/lib/perfil/repositorio-eventos-guardados";
import { ServicioEventosGuardados } from "@/lib/perfil/servicio-eventos-guardados";

export function crearServicioEventosGuardados(): ServicioEventosGuardados {
  return new ServicioEventosGuardados(new RepositorioEventosGuardadosPrisma());
}
