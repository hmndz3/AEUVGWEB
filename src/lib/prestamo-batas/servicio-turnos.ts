import type {
  DatosTurnoPersistido,
  RepositorioTurnos,
} from "@/lib/prestamo-batas/repositorio-turnos";
import { aHoraDeBase } from "@/lib/tutorias/formato-tutorias";
import type { DatosTurno } from "@/validators/prestamo-batas";

export type ResultadoCreacionTurno =
  { tipo: "guardado"; idTurno: number } | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoTurno = ResultadoCreacionTurno | { tipo: "no_encontrado" };

export type ResultadoEliminacionTurno =
  { tipo: "eliminado" } | { tipo: "con_dependencias" } | { tipo: "no_encontrado" };

/**
 * Catálogo de turnos de atención del salón, gestionado por AEUVG.
 *
 * La regla propia es que no se repita un mismo día con el mismo horario: dos
 * turnos idénticos partirían las postulaciones y las asignaciones entre filas
 * que el estudiantado no sabría distinguir.
 */
export class ServicioTurnos {
  constructor(private readonly repositorio: RepositorioTurnos) {}

  private persistir(datos: DatosTurno): DatosTurnoPersistido {
    return {
      diaSemana: datos.diaSemana,
      horaInicio: aHoraDeBase(datos.horaInicio),
      horaFin: aHoraDeBase(datos.horaFin),
      activo: datos.activo,
    };
  }

  private async duplicado(datos: DatosTurnoPersistido, idTurno?: number): Promise<boolean> {
    return this.repositorio.existeTurno(datos.diaSemana, datos.horaInicio, datos.horaFin, idTurno);
  }

  async crear(datos: DatosTurno): Promise<ResultadoCreacionTurno> {
    const persistido = this.persistir(datos);
    if (await this.duplicado(persistido)) {
      return {
        tipo: "invalido",
        errores: { general: "Ya existe un turno con ese día y horario." },
      };
    }

    const idTurno = await this.repositorio.crear(persistido);

    return { tipo: "guardado", idTurno };
  }

  async editar(idTurno: number, datos: DatosTurno): Promise<ResultadoTurno> {
    const persistido = this.persistir(datos);
    if (await this.duplicado(persistido, idTurno)) {
      return {
        tipo: "invalido",
        errores: { general: "Ya existe un turno con ese día y horario." },
      };
    }

    const actualizado = await this.repositorio.actualizar(idTurno, persistido);

    return actualizado ? { tipo: "guardado", idTurno } : { tipo: "no_encontrado" };
  }

  async eliminar(idTurno: number): Promise<ResultadoEliminacionTurno> {
    return this.repositorio.eliminar(idTurno);
  }
}
