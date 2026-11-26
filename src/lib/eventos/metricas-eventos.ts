import { estadoVisible, type EstadoVisible } from "@/lib/eventos/estado-evento";
import type { EstadoEvento, TipoActividad } from "@prisma/client";

/**
 * Métricas del reporte de eventos.
 *
 * Los cálculos están aparte de la consulta a propósito: así se prueban con
 * datos escritos a mano y la página no depende de que la base tenga eventos de
 * un mes concreto para saber si el reporte suma bien.
 *
 * La plataforma no lleva lista de asistentes —nadie pasa asistencia en la
 * puerta—, así que el interés de cada actividad se mide con lo que sí queda
 * registrado: cuántos estudiantes la guardaron y cuántas horas beca generó.
 */

/** Un evento con lo que el reporte necesita de él. */
export type EventoReporte = {
  idEvento: number;
  nombre: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion: string;
  categoria: string;
  tipoActividad: TipoActividad;
  estado: EstadoEvento;
  cupo: number | null;
  informacionAdicional: string | null;
  organizadores: string[];
  /** Estudiantes que lo guardaron en su perfil. */
  guardados: number;
  /** Horas beca acreditadas y pendientes que se registraron en este evento. */
  horasBeca: number;
  /** Cuántas personas apoyaron el evento con horas beca. */
  apoyos: number;
};

export type ResumenEventos = {
  eventos: number;
  porEstado: Record<EstadoVisible, number>;
  /** Cupo sumado de los eventos que lo declaran. */
  cupo: number;
  guardados: number;
  horasBeca: number;
  apoyos: number;
};

const ESTADOS_VISIBLES: EstadoVisible[] = [
  "proximo",
  "en_curso",
  "finalizado",
  "cancelado",
  "borrador",
];

export function resumirEventos(eventos: EventoReporte[], ahora = new Date()): ResumenEventos {
  const porEstado = Object.fromEntries(ESTADOS_VISIBLES.map((estado) => [estado, 0])) as Record<
    EstadoVisible,
    number
  >;

  let cupo = 0;
  let guardados = 0;
  let horasBeca = 0;
  let apoyos = 0;

  for (const evento of eventos) {
    porEstado[estadoVisible(evento, ahora)] += 1;
    cupo += evento.cupo ?? 0;
    guardados += evento.guardados;
    horasBeca += evento.horasBeca;
    apoyos += evento.apoyos;
  }

  return {
    eventos: eventos.length,
    porEstado,
    cupo,
    guardados,
    // Las horas vienen con decimales de cada registro; se redondea al final
    // para que la suma de la pantalla y la del archivo coincidan.
    horasBeca: Math.round(horasBeca * 100) / 100,
    apoyos,
  };
}

/** Una línea de cualquiera de los desgloses del reporte. */
export type LineaMetrica = {
  clave: string;
  etiqueta: string;
  eventos: number;
  guardados: number;
  horasBeca: number;
};

function acumular(
  eventos: EventoReporte[],
  clavesDe: (evento: EventoReporte) => { clave: string; etiqueta: string }[]
): Map<string, LineaMetrica> {
  const lineas = new Map<string, LineaMetrica>();

  for (const evento of eventos) {
    for (const { clave, etiqueta } of clavesDe(evento)) {
      const linea = lineas.get(clave) ?? {
        clave,
        etiqueta,
        eventos: 0,
        guardados: 0,
        horasBeca: 0,
      };

      linea.eventos += 1;
      linea.guardados += evento.guardados;
      linea.horasBeca = Math.round((linea.horasBeca + evento.horasBeca) * 100) / 100;
      lineas.set(clave, linea);
    }
  }

  return lineas;
}

const mesLargo = new Intl.DateTimeFormat("es-GT", {
  month: "long",
  year: "numeric",
  timeZone: "America/Guatemala",
});

/** Clave de mes "AAAA-MM" en la hora del país, que es la que ve la gente. */
export function claveMes(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Guatemala",
  }).format(fecha);

  return partes.slice(0, 7);
}

/**
 * Eventos mes por mes, del más antiguo al más reciente.
 *
 * Se agrupa por la fecha de inicio: es la que la gente asocia con "el evento
 * de octubre", aunque una actividad de varios días termine en noviembre.
 */
export function eventosPorMes(eventos: EventoReporte[]): LineaMetrica[] {
  const lineas = acumular(eventos, (evento) => [
    { clave: claveMes(evento.fechaInicio), etiqueta: mesLargo.format(evento.fechaInicio) },
  ]);

  return [...lineas.values()].sort((a, b) => a.clave.localeCompare(b.clave));
}

/** Eventos por categoría, de la más usada a la menos. */
export function eventosPorCategoria(eventos: EventoReporte[]): LineaMetrica[] {
  const lineas = acumular(eventos, (evento) => [
    { clave: evento.categoria, etiqueta: evento.categoria },
  ]);

  return ordenarPorEventos([...lineas.values()]);
}

/**
 * Eventos por organizador.
 *
 * Un evento con varios organizadores cuenta para cada uno: el reporte responde
 * "en cuántas actividades participó este grupo", y repartir el evento en
 * fracciones no diría nada útil. Por eso la suma de esta tabla puede superar el
 * total de eventos.
 */
export function eventosPorOrganizador(eventos: EventoReporte[]): LineaMetrica[] {
  const lineas = acumular(eventos, (evento) =>
    evento.organizadores.length > 0
      ? evento.organizadores.map((nombre) => ({ clave: nombre, etiqueta: nombre }))
      : [{ clave: "", etiqueta: "Sin organizador registrado" }]
  );

  return ordenarPorEventos([...lineas.values()]);
}

function ordenarPorEventos(lineas: LineaMetrica[]): LineaMetrica[] {
  return lineas.sort((a, b) => b.eventos - a.eventos || a.etiqueta.localeCompare(b.etiqueta, "es"));
}
