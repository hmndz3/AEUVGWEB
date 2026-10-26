import { RepositorioImportacionPrisma } from "@/lib/horas-beca/repositorio-importacion";
import { ServicioImportacionHoras } from "@/lib/horas-beca/servicio-importacion";

export function crearServicioImportacion(): ServicioImportacionHoras {
  return new ServicioImportacionHoras(new RepositorioImportacionPrisma());
}
