import type { RepositorioFichaTutor } from "@/lib/tutorias/repositorio-ficha-tutor";
import type { DatosDisponibilidad, DatosFichaTutor } from "@/validators/tutoria";

/** Franjas de disponibilidad que puede publicar un tutor. */
export const MAXIMO_FRANJAS = 20;

export type ResultadoFicha =
  { tipo: "guardada" } | { tipo: "no_es_tutor" } | { tipo: "invalida"; mensaje: string };

export type ResultadoFranja =
  | { tipo: "agregada"; idDisponibilidad: number }
  | { tipo: "quitada" }
  | { tipo: "no_es_tutor" }
  | { tipo: "no_encontrada" }
  | { tipo: "invalida"; mensaje: string };

/** Dos franjas del mismo día se enciman si una empieza antes de que la otra acabe. */
function seEnciman(
  una: { horaInicio: string; horaFin: string },
  otra: { horaInicio: string; horaFin: string }
): boolean {
  return una.horaInicio < otra.horaFin && otra.horaInicio < una.horaFin;
}

/**
 * La ficha pública del tutor y sus franjas de disponibilidad.
 *
 * Todo se resuelve contra el tutor de la sesión y nunca contra un
 * identificador del cuerpo: la ficha es de quien la edita, y recibir el tutor
 * por parámetro permitiría editar la de cualquiera.
 *
 * La regla propia es que dos franjas del mismo día no pueden encimarse. Es lo
 * que impide que el estudiante vea dos huecos para la misma hora y el tutor
 * acabe con dos tutorías a la vez.
 */
export class ServicioFichaTutor {
  constructor(private readonly repositorio: RepositorioFichaTutor) {}

  async guardarFicha(idUsuario: number, datos: DatosFichaTutor): Promise<ResultadoFicha> {
    const idTutor = await this.repositorio.tutorDeUsuario(idUsuario);
    if (idTutor === null) return { tipo: "no_es_tutor" };

    const guardada = await this.repositorio.actualizarFicha(idTutor, datos);

    return guardada ? { tipo: "guardada" } : { tipo: "no_es_tutor" };
  }

  async agregarFranja(idUsuario: number, datos: DatosDisponibilidad): Promise<ResultadoFranja> {
    const idTutor = await this.repositorio.tutorDeUsuario(idUsuario);
    if (idTutor === null) return { tipo: "no_es_tutor" };

    const franjas = await this.repositorio.franjasDe(idTutor);

    if (franjas.length >= MAXIMO_FRANJAS) {
      return {
        tipo: "invalida",
        mensaje: `No puedes publicar más de ${MAXIMO_FRANJAS} franjas de disponibilidad.`,
      };
    }

    const choque = franjas.find(
      (franja) => franja.diaSemana === datos.diaSemana && seEnciman(franja, datos)
    );

    if (choque) {
      return {
        tipo: "invalida",
        mensaje: `Ya tienes una franja ese día de ${choque.horaInicio} a ${choque.horaFin}. Quítala antes de agregar una que se encime.`,
      };
    }

    const idDisponibilidad = await this.repositorio.agregarFranja(idTutor, datos);

    return { tipo: "agregada", idDisponibilidad };
  }

  async quitarFranja(idUsuario: number, idDisponibilidad: number): Promise<ResultadoFranja> {
    const idTutor = await this.repositorio.tutorDeUsuario(idUsuario);
    if (idTutor === null) return { tipo: "no_es_tutor" };

    const quitada = await this.repositorio.quitarFranja(idTutor, idDisponibilidad);

    return quitada ? { tipo: "quitada" } : { tipo: "no_encontrada" };
  }
}
