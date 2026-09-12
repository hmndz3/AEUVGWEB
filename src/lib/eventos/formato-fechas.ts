/**
 * Presentación de fechas de eventos.
 *
 * Todo el sitio muestra las fechas en la zona horaria de Guatemala, sin importar
 * la del navegador o la del servidor: un evento que empieza a las 3 de la tarde
 * en el campus debe leerse igual para todos. Las fechas se guardan en UTC
 * (`timestamptz`) y solo se convierten al momento de mostrarlas.
 */
export const ZONA_HORARIA = "America/Guatemala";

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
