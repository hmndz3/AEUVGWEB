import { RepositorioEventosPrisma } from "@/lib/eventos/repositorio-eventos";
import { ServicioEventos } from "@/lib/eventos/servicio-eventos";

export function crearServicioEventos(): ServicioEventos {
  return new ServicioEventos(new RepositorioEventosPrisma());
}
