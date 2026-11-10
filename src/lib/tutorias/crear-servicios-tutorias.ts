import { RepositorioTutoriasPrisma } from "@/lib/tutorias/repositorio-tutorias";
import { ServicioPostulaciones, ServicioTutores } from "@/lib/tutorias/servicio-postulaciones";

export function crearServicioPostulaciones(): ServicioPostulaciones {
  return new ServicioPostulaciones(new RepositorioTutoriasPrisma());
}

export function crearServicioTutores(): ServicioTutores {
  return new ServicioTutores(new RepositorioTutoriasPrisma());
}
