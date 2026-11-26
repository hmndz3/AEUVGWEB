import {
  aFechaDeCalendario,
  describirTurno,
  diaSemanaDeFechaDeCalendario,
  duracionHorasTurno,
} from "@/lib/prestamo-batas/formato-prestamo-batas";
import type { RepositorioComprobantes } from "@/lib/prestamo-batas/repositorio-comprobantes";
import type { ServicioHorasBeca } from "@/lib/horas-beca/servicio-horas-beca";
import { aHoraDeBase, ETIQUETAS_DIA } from "@/lib/tutorias/formato-tutorias";
import type { DatosComprobanteTurno } from "@/validators/prestamo-batas";

export type ResultadoComprobante =
  | { tipo: "enviado"; idComprobante: number }
  | { tipo: "sin_estudiante" }
  | { tipo: "invalido"; errores: Record<string, string> };

export type ResultadoRevisionComprobante =
  | { tipo: "resuelto"; estado: "APROBADO" | "RECHAZADO"; horasAcreditadas: number | null }
  | { tipo: "no_encontrado" }
  | { tipo: "no_permitido"; mensaje: string };

/** Descripción con la que se registran las horas de voluntariado. */
const DESCRIPCION_ACTIVIDAD = "Voluntariado de préstamo de batas";

/** Día de calendario de hoy en Guatemala, como medianoche en UTC, para comparar fechas. */
function hoyEnGuatemala(ahora: Date): Date {
  const clave = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Guatemala",
  }).format(ahora);

  return new Date(`${clave}T00:00:00.000Z`);
}

/**
 * Comprobantes de entrada y salida con los que el voluntario acredita sus horas.
 *
 * Reúne las dos mitades del trámite: el voluntario envía el comprobante de un
 * turno al que está asignado, y AEUVG lo revisa. Al aprobarlo se crea un
 * registro de horas beca pendiente de acreditar, por la duración del turno,
 * reutilizando el servicio de horas beca para que esas horas vivan junto con el
 * resto de las del estudiante. La fecha tiene que caer en el día del turno y no
 * puede ser futura: el comprobante es de un turno ya atendido.
 */
export class ServicioComprobantes {
  constructor(
    private readonly repositorio: RepositorioComprobantes,
    private readonly servicioHorasBeca: ServicioHorasBeca,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async enviar(idUsuario: number, datos: DatosComprobanteTurno): Promise<ResultadoComprobante> {
    const voluntario = await this.repositorio.voluntarioDeSesion(idUsuario);
    if (!voluntario) return { tipo: "sin_estudiante" };

    const turno = await this.repositorio.turnoAsignado(voluntario.idEstudiante, datos.idTurno);
    if (!turno) {
      return { tipo: "invalido", errores: { idTurno: "No estás asignado a ese turno." } };
    }

    const fecha = aFechaDeCalendario(datos.fecha);

    if (diaSemanaDeFechaDeCalendario(fecha) !== turno.diaSemana) {
      return {
        tipo: "invalido",
        errores: {
          fecha: `La fecha debe caer en ${ETIQUETAS_DIA[turno.diaSemana]}, el día del turno.`,
        },
      };
    }
    if (fecha.getTime() > hoyEnGuatemala(this.ahora()).getTime()) {
      return {
        tipo: "invalido",
        errores: {
          fecha: "La fecha no puede ser futura: el comprobante es de un turno ya atendido.",
        },
      };
    }

    const idComprobante = await this.repositorio.crearComprobante(
      {
        idTurno: datos.idTurno,
        fecha,
        horaEntrada: aHoraDeBase(datos.horaEntrada),
        horaSalida: aHoraDeBase(datos.horaSalida),
        comentarioVoluntario: datos.comentarioVoluntario,
      },
      voluntario.idEstudiante
    );

    return { tipo: "enviado", idComprobante };
  }

  async revisar(
    idComprobante: number,
    decision: "aprobar" | "rechazar",
    comentario: string | null,
    revisadoPor: number
  ): Promise<ResultadoRevisionComprobante> {
    const comprobante = await this.repositorio.comprobantePorId(idComprobante);
    if (!comprobante) return { tipo: "no_encontrado" };

    if (comprobante.estado !== "PENDIENTE") {
      return {
        tipo: "no_permitido",
        mensaje: `Este comprobante ya fue ${comprobante.estado === "APROBADO" ? "aprobado" : "rechazado"}.`,
      };
    }

    const ahora = this.ahora();

    if (decision === "rechazar") {
      const aplicado = await this.repositorio.rechazar(
        idComprobante,
        revisadoPor,
        comentario,
        ahora
      );

      return aplicado
        ? { tipo: "resuelto", estado: "RECHAZADO", horasAcreditadas: null }
        : { tipo: "no_encontrado" };
    }

    const horas = duracionHorasTurno(comprobante.turno.horaInicio, comprobante.turno.horaFin);

    // Las horas se registran reutilizando el servicio de horas beca: nacen como
    // pendientes de acreditar y se resuelven al carnet del voluntario si tiene
    // cuenta, igual que cualquier otra hora.
    const resultadoHora = await this.servicioHorasBeca.crear(
      {
        carnet: comprobante.estudiante.carnet,
        nombreEstudiante: comprobante.estudiante.nombreCompleto,
        fechaActividad: comprobante.fecha,
        horarioApoyo: describirTurno(
          comprobante.turno.diaSemana,
          comprobante.turno.horaInicio,
          comprobante.turno.horaFin
        ),
        descripcionActividad: DESCRIPCION_ACTIVIDAD,
        cantidadHoras: horas,
        observaciones: comentario,
      },
      revisadoPor
    );

    if (resultadoHora.tipo !== "guardado") {
      const detalle =
        resultadoHora.tipo === "invalido"
          ? Object.values(resultadoHora.errores)[0]
          : "el registro ya no existe";

      return {
        tipo: "no_permitido",
        mensaje: `No se pudieron acreditar las horas: ${detalle}`,
      };
    }

    const aplicado = await this.repositorio.aprobar(
      idComprobante,
      resultadoHora.id,
      revisadoPor,
      comentario,
      ahora
    );

    if (!aplicado) {
      // El comprobante dejó de estar pendiente entre la revisión y el guardado;
      // se deshace el registro de horas para no dejarlo huérfano.
      await this.servicioHorasBeca.eliminar(resultadoHora.id);
      return { tipo: "no_permitido", mensaje: "El comprobante ya fue revisado por otra persona." };
    }

    return { tipo: "resuelto", estado: "APROBADO", horasAcreditadas: horas };
  }
}
