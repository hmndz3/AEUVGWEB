import { RepositorioPerfilPrisma } from "@/lib/perfil/repositorio-perfil";
import { ServicioPerfil } from "@/lib/perfil/servicio-perfil";

export function crearServicioPerfil(): ServicioPerfil {
  return new ServicioPerfil(new RepositorioPerfilPrisma());
}
