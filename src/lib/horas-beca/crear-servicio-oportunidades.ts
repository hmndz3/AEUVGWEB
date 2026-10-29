import { RepositorioOportunidadesPrisma } from "@/lib/horas-beca/repositorio-oportunidades";
import { ServicioOportunidades } from "@/lib/horas-beca/servicio-oportunidades";

export function crearServicioOportunidades(): ServicioOportunidades {
  return new ServicioOportunidades(new RepositorioOportunidadesPrisma());
}
