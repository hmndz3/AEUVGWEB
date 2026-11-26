import { crearServicioCursos } from "@/lib/tutorias/crear-servicios-tutorias";
import { RepositorioImportacionCursosPrisma } from "@/lib/tutorias/repositorio-importacion-cursos";
import { ServicioImportacionCursos } from "@/lib/tutorias/servicio-importacion-cursos";

/** Arma la importación de cursos sobre el mismo servicio que usa el catálogo. */
export function crearServicioImportacionCursos(): ServicioImportacionCursos {
  return new ServicioImportacionCursos(
    new RepositorioImportacionCursosPrisma(),
    crearServicioCursos()
  );
}
