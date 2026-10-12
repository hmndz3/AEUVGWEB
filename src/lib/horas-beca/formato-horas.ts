/**
 * Presentación de los datos de horas beca.
 *
 * La fecha de la actividad es un día de calendario (`date`), sin hora. Se
 * formatea en UTC y no en la zona de Guatemala a propósito: PostgreSQL la
 * entrega como la medianoche en UTC, y convertirla al país la correría al día
 * anterior, de modo que un apoyo del 9 de octubre se leería como del 8.
 */
const ZONA_DIA_CALENDARIO = "UTC";

const fechaActividad = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA_DIA_CALENDARIO,
});

const fechaAcreditacion = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Guatemala",
});

export function formatearFechaActividad(fecha: Date): string {
  return fechaActividad.format(fecha);
}

/**
 * La acreditación sí es un instante (`timestamptz`), así que se presenta en la
 * hora de Guatemala como el resto de las fechas del sitio.
 */
export function formatearFechaAcreditacion(fecha: Date): string {
  return fechaAcreditacion.format(fecha);
}

/** Día de calendario en el formato que espera un campo de fecha del formulario. */
export function diaParaFormulario(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Cantidad de horas sin decimales de adorno: media hora se lee "0.5" y dos
 * horas exactas se leen "2", no "2.00".
 */
export function formatearHoras(horas: number): string {
  return horas
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}
