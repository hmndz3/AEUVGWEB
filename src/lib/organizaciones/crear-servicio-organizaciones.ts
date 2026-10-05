import { RepositorioOrganizacionesPrisma } from "@/lib/organizaciones/repositorio-organizaciones";
import { ServicioOrganizaciones } from "@/lib/organizaciones/servicio-organizaciones";

export function crearServicioOrganizaciones(): ServicioOrganizaciones {
  return new ServicioOrganizaciones(new RepositorioOrganizacionesPrisma());
}
