import { crearGuardadoDeImagenes } from "@/lib/importacion/guardado-imagenes";
import { crearServicioOrganizaciones } from "@/lib/organizaciones/crear-servicio-organizaciones";
import { RepositorioImportacionOrganizacionesPrisma } from "@/lib/organizaciones/repositorio-importacion-organizaciones";
import { ServicioImportacionOrganizaciones } from "@/lib/organizaciones/servicio-importacion-organizaciones";

export function crearServicioImportacionOrganizaciones(): ServicioImportacionOrganizaciones {
  return new ServicioImportacionOrganizaciones(
    new RepositorioImportacionOrganizacionesPrisma(),
    crearServicioOrganizaciones(),
    crearGuardadoDeImagenes()
  );
}
