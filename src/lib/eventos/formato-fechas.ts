/**
 * Presentación de fechas de eventos.
 *
 * Todo el sitio muestra las fechas en la zona horaria de Guatemala, sin importar
 * la del navegador o la del servidor: un evento que empieza a las 3 de la tarde
 * en el campus debe leerse igual para todos. Las fechas se guardan en UTC
 * (`timestamptz`) y solo se convierten al momento de mostrarlas.
 */
export const ZONA_HORARIA = "America/Guatemala";

/**
 * Guatemala usa UTC-6 todo el año: no aplica horario de verano desde 2006, por
 * lo que el desplazamiento puede escribirse fijo.
 */
export const DESPLAZAMIENTO_GUATEMALA = "-06:00";

const LOCALE = "es-GT";

const fechaLarga = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: ZONA_HORARIA,
});

const fechaCorta = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: ZONA_HORARIA,
});

const fechaConAnio = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA_HORARIA,
});

const hora = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: ZONA_HORARIA,
});

// en-CA produce el formato AAAA-MM-DD, que es el que se usa como clave de día.
const claveDia = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ZONA_HORARIA,
});

export function formatearFechaLarga(fecha: Date): string {
  return fechaLarga.format(fecha);
}

export function formatearFechaCorta(fecha: Date): string {
  return fechaCorta.format(fecha);
}

export function formatearFechaConAnio(fecha: Date): string {
  return fechaConAnio.format(fecha);
}

export function formatearHora(fecha: Date): string {
  return hora.format(fecha);
}

/** Clave AAAA-MM-DD del día al que pertenece la fecha en Guatemala. */
export function claveDiaLocal(fecha: Date): string {
  return claveDia.format(fecha);
}

/**
 * Rango legible de un evento. Cuando empieza y termina el mismo día se muestra
 * una sola fecha con las dos horas, que es el caso habitual.
 */
export function formatearRango(inicio: Date, fin: Date): string {
  if (claveDiaLocal(inicio) === claveDiaLocal(fin)) {
    return `${formatearFechaLarga(inicio)} · ${formatearHora(inicio)} a ${formatearHora(fin)}`;
  }

  return `${formatearFechaCorta(inicio)}, ${formatearHora(inicio)} a ${formatearFechaCorta(fin)}, ${formatearHora(fin)}`;
}

const campoFechaHora = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA_HORARIA,
});

/**
 * Valor para un campo datetime-local, en hora de Guatemala. El navegador
 * muestra la hora tal cual, sin convertirla a la zona del equipo.
 */
export function paraCampoFechaHora(fecha: Date): string {
  const partes = Object.fromEntries(
    campoFechaHora.formatToParts(fecha).map((parte) => [parte.type, parte.value])
  );

  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

/**
 * Interpreta lo que escribió el administrador como hora de Guatemala. Sin el
 * desplazamiento explícito, el valor del campo se leería en la zona horaria de
 * quien lo procese y un evento podría guardarse con seis horas de diferencia.
 */
export function desdeCampoFechaHora(valor: string): string {
  return `${valor}:00${DESPLAZAMIENTO_GUATEMALA}`;
}
