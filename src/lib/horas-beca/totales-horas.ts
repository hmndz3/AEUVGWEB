import type { EstadoHoraBeca } from "@prisma/client";

export type TotalesHorasBeca = {
  /** Horas de todas las actividades registradas, acreditadas o no. */
  realizadas: number;
  acreditadas: number;
  pendientes: number;
  actividades: number;
};

/**
 * Totales de horas de un conjunto de registros.
 *
 * Se calcula sobre los registros ya consultados y no en la base, al contrario
 * que el resumen del panel: un estudiante tiene decenas de actividades, no
 * miles, y hacerlo aquí deja el cálculo probado sin levantar una base de datos.
 *
 * Las horas se suman en centésimas y se dividen al final. Las cantidades vienen
 * de una columna `Decimal(6,2)` y sumar 0.1 treinta veces en coma flotante da
 * 2.9999999999999996, que en pantalla se leería como 3 pero descuadraría al
 * compararlo con lo que reporta el panel.
 */
export function calcularTotalesHoras(
  registros: readonly { cantidadHoras: number; estado: EstadoHoraBeca }[]
): TotalesHorasBeca {
  let acreditadas = 0;
  let pendientes = 0;

  for (const registro of registros) {
    const centesimas = Math.round(registro.cantidadHoras * 100);

    if (registro.estado === "ACREDITADA") acreditadas += centesimas;
    else pendientes += centesimas;
  }

  return {
    realizadas: (acreditadas + pendientes) / 100,
    acreditadas: acreditadas / 100,
    pendientes: pendientes / 100,
    actividades: registros.length,
  };
}
