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

/**
 * Nombre con el que se presenta un registro.
 *
 * Cuando el carnet ya tiene cuenta se usa el nombre de la cuenta, que es el
 * verificado contra el correo institucional; si no, el que AEUVG escribió en su
 * hoja, que es el único que existe para ese carnet.
 */
export function nombreVisibleDelRegistro(registro: {
  nombreEstudiante: string;
  nombreCuenta: string | null;
}): string {
  return registro.nombreCuenta ?? registro.nombreEstudiante;
}

/**
 * Nombre con el que se cargó el registro, solo cuando difiere del de la cuenta.
 * Sirve para que AEUVG detecte una fila capturada con el carnet de otra persona:
 * el nombre de la hoja y el de la cuenta no coincidirían.
 */
export function nombreCargadoDistinto(registro: {
  nombreEstudiante: string;
  nombreCuenta: string | null;
}): string | null {
  if (registro.nombreCuenta === null) return null;

  return registro.nombreCuenta.trim().toLocaleLowerCase("es") ===
    registro.nombreEstudiante.trim().toLocaleLowerCase("es")
    ? null
    : registro.nombreEstudiante;
}

/** Ruta base de la sección de horas beca del panel. */
export const RUTA_PANEL_HORAS = "/admin/horas-beca";

/**
 * Destino al que vuelve el formulario después de guardar.
 *
 * AEUVG lo pidió en la revisión: al guardar un registro, el panel volvía al
 * listado sin filtros y había que escribir otra vez el periodo que se estaba
 * revisando. El destino viaja en la dirección, así que se comprueba que sea una
 * ruta interna de esta misma sección: cualquier otro valor permitiría usar el
 * formulario para enviar a alguien a un sitio ajeno.
 */
export function destinoPanelHoras(valor: string | string[] | undefined): string {
  const ruta = Array.isArray(valor) ? valor[0] : valor;

  if (!ruta || !ruta.startsWith(RUTA_PANEL_HORAS)) return RUTA_PANEL_HORAS;
  if (ruta.startsWith(`${RUTA_PANEL_HORAS}//`)) return RUTA_PANEL_HORAS;

  const siguiente = ruta.slice(RUTA_PANEL_HORAS.length);

  return siguiente === "" || siguiente.startsWith("?") ? ruta : RUTA_PANEL_HORAS;
}
