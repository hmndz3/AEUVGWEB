import { RepositorioFichaTutorPrisma } from "@/lib/tutorias/repositorio-ficha-tutor";
import { RepositorioTutoriasPrisma } from "@/lib/tutorias/repositorio-tutorias";
import { ServicioFichaTutor } from "@/lib/tutorias/servicio-ficha-tutor";
import { ServicioPostulaciones, ServicioTutores } from "@/lib/tutorias/servicio-postulaciones";

export function crearServicioPostulaciones(): ServicioPostulaciones {
  return new ServicioPostulaciones(new RepositorioTutoriasPrisma());
}

export function crearServicioTutores(): ServicioTutores {
  return new ServicioTutores(new RepositorioTutoriasPrisma());
}

export function crearServicioFichaTutor(): ServicioFichaTutor {
  return new ServicioFichaTutor(new RepositorioFichaTutorPrisma());
}
