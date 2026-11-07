import { RepositorioTutoriasPrisma } from "@/lib/tutorias/repositorio-tutorias";
import { ServicioPostulaciones } from "@/lib/tutorias/servicio-postulaciones";

export function crearServicioPostulaciones(): ServicioPostulaciones {
  return new ServicioPostulaciones(new RepositorioTutoriasPrisma());
}
