import { RepositorioImportacionEventosPrisma } from "@/lib/eventos/repositorio-importacion-eventos";
import { ServicioImportacionEventos } from "@/lib/eventos/servicio-importacion-eventos";
import { crearGuardadoDeImagenes } from "@/lib/importacion/guardado-imagenes";

export function crearServicioImportacionEventos(): ServicioImportacionEventos {
  return new ServicioImportacionEventos(
    new RepositorioImportacionEventosPrisma(),
    crearGuardadoDeImagenes()
  );
}
