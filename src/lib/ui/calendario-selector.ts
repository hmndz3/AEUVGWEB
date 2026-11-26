/**
 * Cálculos del selector de fecha y del de hora.
 *
 * Viven aparte de los componentes para poder comprobarlos sin montar nada: son
 * la parte donde un error pasa inadvertido, porque una rejilla con el día
 * corrido una casilla se sigue viendo como un calendario.
 *
 * Todo se trabaja sobre días de calendario en texto (`YYYY-MM-DD`) y no sobre
 * instantes. Es el mismo criterio del resto del proyecto: las fechas que el
 * estudiantado elige son días, no momentos, y pasarlas por la zona horaria del
 * navegador las correría un día.
 */

/** Un día de la rejilla del mes. */
export type DiaDelMes = {
  /** El día en `YYYY-MM-DD`. */
  iso: string;
  /** Número que se pinta en la casilla. */
  numero: number;
  /** Falso para los días de relleno de los meses vecinos. */
  delMes: boolean;
  /** Día de la semana en la convención de JavaScript: 0 es domingo. */
  diaSemana: number;
};

/** Encabezados de la rejilla, empezando en lunes como se usa en Guatemala. */
export const DIAS_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] as const;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Nombre del mes y el año, como se rotula el calendario. */
export function nombreDelMes(anio: number, mes: number): string {
  return `${MESES[mes]} de ${anio}`;
}

const aIso = (fecha: Date): string => fecha.toISOString().slice(0, 10);

/** El día de hoy en Guatemala, que es el que marca el calendario. */
export function hoyEnGuatemala(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Guatemala",
  }).format(ahora);
}

/** Descompone un `YYYY-MM-DD`, o null si no tiene esa forma. */
export function partesDeIso(iso: string): { anio: number; mes: number; dia: number } | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) return null;

  const anio = Number(partes[1]);
  const mes = Number(partes[2]) - 1;
  const dia = Number(partes[3]);
  const fecha = new Date(Date.UTC(anio, mes, dia));

  // Rechaza un 31 de febrero: la fecha existe como texto pero no en el calendario.
  return fecha.getUTCMonth() === mes && fecha.getUTCDate() === dia ? { anio, mes, dia } : null;
}

/**
 * La rejilla del mes, con el relleno de los meses vecinos.
 *
 * Siempre son seis semanas completas para que el calendario no cambie de alto
 * al pasar de un mes a otro, que es lo que hace saltar la pantalla debajo.
 */
export function construirMes(anio: number, mes: number): DiaDelMes[] {
  const primero = new Date(Date.UTC(anio, mes, 1));
  // getUTCDay() devuelve 0 para domingo; la rejilla empieza en lunes.
  const desplazamiento = (primero.getUTCDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(Date.UTC(anio, mes, 1 - desplazamiento + indice));

    return {
      iso: aIso(fecha),
      numero: fecha.getUTCDate(),
      delMes: fecha.getUTCMonth() === mes,
      diaSemana: fecha.getUTCDay(),
    };
  });
}

export type LimitesDia = {
  /** Primer día elegible, en `YYYY-MM-DD`. */
  minimo?: string;
  maximo?: string;
  /**
   * Días de la semana elegibles, en la convención de JavaScript (0 es domingo).
   * Sin esta lista valen todos. La usa la solicitud de tutoría para que solo se
   * puedan elegir los días en los que el tutor publicó disponibilidad.
   */
  diasPermitidos?: readonly number[];
};

/** Si un día se puede elegir. Los de relleno del mes vecino también cuentan. */
export function esDiaElegible(dia: DiaDelMes, limites: LimitesDia): boolean {
  if (limites.minimo && dia.iso < limites.minimo) return false;
  if (limites.maximo && dia.iso > limites.maximo) return false;
  if (limites.diasPermitidos && !limites.diasPermitidos.includes(dia.diaSemana)) return false;

  return true;
}

/**
 * El primer día elegible a partir de uno dado, mirando hacia adelante.
 *
 * Sirve para abrir el calendario en un mes que tenga algo que elegir: si el
 * tutor solo da tutorías los jueves y el mes en curso ya se acabó, abrirlo en
 * el mes actual mostraría una rejilla entera en gris.
 */
export function primerDiaElegible(
  desde: string,
  limites: LimitesDia,
  diasAExplorar = 180
): string | null {
  const partes = partesDeIso(desde);
  if (!partes) return null;

  for (let salto = 0; salto < diasAExplorar; salto += 1) {
    const fecha = new Date(Date.UTC(partes.anio, partes.mes, partes.dia + salto));
    const dia: DiaDelMes = {
      iso: aIso(fecha),
      numero: fecha.getUTCDate(),
      delMes: true,
      diaSemana: fecha.getUTCDay(),
    };

    if (esDiaElegible(dia, limites)) return dia.iso;
  }

  return null;
}

/** El día en el formato en el que se presenta: "jueves 19 de noviembre". */
export function formatearDiaLargo(iso: string): string {
  const partes = partesDeIso(iso);
  if (!partes) return "";

  return new Intl.DateTimeFormat("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(partes.anio, partes.mes, partes.dia)));
}

/** Minutos desde la medianoche de una hora de reloj "HH:MM". */
export function minutosDeHora(hora: string): number | null {
  const partes = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);

  return partes ? Number(partes[1]) * 60 + Number(partes[2]) : null;
}

/** Hora de reloj a partir de los minutos desde la medianoche. */
export function horaDeMinutos(minutos: number): string {
  const horas = Math.floor(minutos / 60) % 24;

  return `${String(horas).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/**
 * Las horas que ofrece el selector, de `minimo` a `maximo` cada `paso`.
 *
 * El máximo se incluye cuando cae justo en un paso: en una franja que termina a
 * las 18:00, las 18:00 son una hora de fin válida y dejarla fuera impediría
 * agendar hasta el final del horario del tutor.
 */
export function horasDisponibles(paso = 30, minimo = "00:00", maximo = "23:59"): string[] {
  const desde = minutosDeHora(minimo) ?? 0;
  const hasta = minutosDeHora(maximo) ?? 23 * 60 + 59;
  if (paso <= 0 || hasta < desde) return [];

  const horas: string[] = [];
  for (let minutos = desde; minutos <= hasta; minutos += paso) horas.push(horaDeMinutos(minutos));

  return horas;
}

/** La hora como se lee: "2:30 p.m." en lugar de "14:30". */
export function formatearHora12(hora: string): string {
  const minutos = minutosDeHora(hora);
  if (minutos === null) return hora;

  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const meridiano = h < 12 ? "a.m." : "p.m.";
  const doce = h % 12 === 0 ? 12 : h % 12;

  return `${doce}:${String(m).padStart(2, "0")} ${meridiano}`;
}
