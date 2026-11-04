import { RepositorioImportacionPrisma } from "@/lib/horas-beca/repositorio-importacion";
import { ServicioLoteHoras } from "@/lib/horas-beca/servicio-lote-horas";

export function crearServicioLoteHoras(): ServicioLoteHoras {
  return new ServicioLoteHoras(new RepositorioImportacionPrisma());
}
