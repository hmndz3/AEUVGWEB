import { RepositorioAgendaPrisma } from "@/lib/tutorias/repositorio-agenda";
import { RepositorioCursosPrisma } from "@/lib/tutorias/repositorio-cursos";
import { RepositorioFichaTutorPrisma } from "@/lib/tutorias/repositorio-ficha-tutor";
import { RepositorioTutoriasPrisma } from "@/lib/tutorias/repositorio-tutorias";
import { RepositorioValidacionTutoriasPrisma } from "@/lib/tutorias/repositorio-validacion-tutorias";
import { ServicioAgenda } from "@/lib/tutorias/servicio-agenda";
import { ServicioCursos } from "@/lib/tutorias/servicio-cursos";
import { ServicioFichaTutor } from "@/lib/tutorias/servicio-ficha-tutor";
import { ServicioPostulaciones, ServicioTutores } from "@/lib/tutorias/servicio-postulaciones";
import { ServicioValidacionTutorias } from "@/lib/tutorias/servicio-validacion-tutorias";

export function crearServicioPostulaciones(): ServicioPostulaciones {
  return new ServicioPostulaciones(new RepositorioTutoriasPrisma());
}

export function crearServicioTutores(): ServicioTutores {
  return new ServicioTutores(new RepositorioTutoriasPrisma());
}

export function crearServicioFichaTutor(): ServicioFichaTutor {
  return new ServicioFichaTutor(new RepositorioFichaTutorPrisma());
}

export function crearServicioAgenda(): ServicioAgenda {
  return new ServicioAgenda(new RepositorioAgendaPrisma());
}

export function crearServicioCursos(): ServicioCursos {
  return new ServicioCursos(new RepositorioCursosPrisma());
}

export function crearServicioValidacionTutorias(): ServicioValidacionTutorias {
  return new ServicioValidacionTutorias(new RepositorioValidacionTutoriasPrisma());
}
