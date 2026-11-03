import { componerHorario } from "@/lib/horas-beca/formato-horas";
import type { FilaCruda } from "@/lib/horas-beca/importacion";
import type { DatosRegistroHora } from "@/lib/horas-beca/servicio-horas-beca";
import { erroresPorCampo } from "@/validators/errores";
import { ETIQUETAS_CAMPO_HORA_BECA, esquemaRegistroHoraAdmin } from "@/validators/hora-beca-admin";

/** Un problema encontrado en una fila del archivo. */
export type ErrorFila = {
  /** Número de fila en la hoja, tal como lo muestra Excel. */
  fila: number;
  carnet: string;
  campo: string;
  mensaje: string;
};

export type ResultadoValidacion = {
  validas: { fila: number; datos: DatosRegistroHora }[];
  errores: ErrorFila[];
  total: number;
};

/**
 * Valida el archivo fila por fila sin escribir nada.
 *
 * Reutiliza el mismo esquema que el formulario del panel: si la regla de un
 * campo cambia, cambia en los dos sitios a la vez. Lo único que agrega es armar
 * el horario a partir de las dos columnas de la hoja.
 *
 * Una fila con varios problemas se reporta una sola vez, con el primero: el
 * objetivo del reporte es que AEUVG sepa qué filas revisar, no abrumarla con
 * cinco mensajes de la misma línea.
 */
export function validarFilas(filas: FilaCruda[]): ResultadoValidacion {
  const validas: ResultadoValidacion["validas"] = [];
  const errores: ErrorFila[] = [];

  for (const cruda of filas) {
    const resultado = esquemaRegistroHoraAdmin.safeParse({
      carnet: cruda.carnet,
      nombreEstudiante: cruda.nombreEstudiante,
      fechaActividad: cruda.fechaActividad,
      horarioApoyo: componerHorario(cruda.horaInicio, cruda.horaFin),
      descripcionActividad: cruda.descripcionActividad,
      cantidadHoras: cruda.cantidadHoras,
      observaciones: cruda.observaciones,
    });

    if (resultado.success) {
      validas.push({ fila: cruda.fila, datos: resultado.data });
      continue;
    }

    const porCampo = erroresPorCampo(resultado.error);
    const [campo, mensaje] = Object.entries(porCampo)[0];

    errores.push({
      fila: cruda.fila,
      carnet: cruda.carnet,
      campo: ETIQUETAS_CAMPO_HORA_BECA[campo] ?? campo,
      mensaje,
    });
  }

  return { validas, errores, total: filas.length };
}
