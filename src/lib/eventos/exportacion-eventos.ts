import { etiquetaEstado, estadoVisible } from "@/lib/eventos/estado-evento";
import type { EventoReporte } from "@/lib/eventos/metricas-eventos";
import { escaparCampoCsv } from "@/lib/horas-beca/exportar-csv";
import { ETIQUETAS_TIPO_ACTIVIDAD } from "@/validators/eventos";

/**
 * Descarga del reporte de eventos.
 *
 * Lleva los mismos datos que se piden al crear un evento, más lo que la
 * plataforma sabe de él: cuánta gente lo guardó y cuántas horas beca generó.
 * La conversión a fila está en un solo sitio para que el CSV y el Excel digan
 * exactamente lo mismo.
 */

export const COLUMNAS_EXPORTACION_EVENTOS = [
  "Nombre del evento",
  "Descripción",
  "Categoría",
  "Tipo de actividad",
  "Estado",
  "Fecha de inicio",
  "Hora de inicio",
  "Fecha de fin",
  "Hora de fin",
  "Ubicación",
  "Organizadores",
  "Cupo",
  "Información adicional",
  "Estudiantes que lo guardaron",
  "Horas beca",
  "Personas con horas beca",
] as const;

export type FilaExportacionEvento = {
  nombre: string;
  descripcion: string;
  categoria: string;
  tipoActividad: string;
  estado: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  ubicacion: string;
  organizadores: string;
  cupo: string;
  informacionAdicional: string;
  guardados: number;
  horasBeca: number;
  apoyos: number;
};

const fechaGuatemala = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Guatemala",
});

const horaGuatemala = new Intl.DateTimeFormat("es-GT", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Guatemala",
});

/** Fecha de un evento como la escribió quien lo creó: AAAA-MM-DD en Guatemala. */
export function fechaDeEvento(fecha: Date): string {
  return fechaGuatemala.format(fecha);
}

export function horaDeEvento(fecha: Date): string {
  return horaGuatemala.format(fecha);
}

export function aFilaExportacionEvento(
  evento: EventoReporte,
  ahora = new Date()
): FilaExportacionEvento {
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    categoria: evento.categoria,
    tipoActividad: ETIQUETAS_TIPO_ACTIVIDAD[evento.tipoActividad],
    estado: etiquetaEstado(estadoVisible(evento, ahora)),
    fechaInicio: fechaDeEvento(evento.fechaInicio),
    horaInicio: horaDeEvento(evento.fechaInicio),
    fechaFin: fechaDeEvento(evento.fechaFin),
    horaFin: horaDeEvento(evento.fechaFin),
    ubicacion: evento.ubicacion,
    organizadores: evento.organizadores.join(" · "),
    cupo: evento.cupo === null ? "" : String(evento.cupo),
    informacionAdicional: evento.informacionAdicional ?? "",
    guardados: evento.guardados,
    horasBeca: evento.horasBeca,
    apoyos: evento.apoyos,
  };
}

/** Los valores de una fila en el orden de COLUMNAS_EXPORTACION_EVENTOS. */
export function valoresDeFilaEvento(fila: FilaExportacionEvento): (string | number)[] {
  return [
    fila.nombre,
    fila.descripcion,
    fila.categoria,
    fila.tipoActividad,
    fila.estado,
    fila.fechaInicio,
    fila.horaInicio,
    fila.fechaFin,
    fila.horaFin,
    fila.ubicacion,
    fila.organizadores,
    fila.cupo,
    fila.informacionAdicional,
    fila.guardados,
    fila.horasBeca,
    fila.apoyos,
  ];
}

/** Lleva la fecha porque el mismo reporte se descarga varias veces en un periodo. */
export function nombreArchivoEventos(extension: string, ahora = new Date()): string {
  return `eventos-${ahora.toISOString().slice(0, 10)}.${extension}`;
}

const MARCA_UTF8 = "﻿";
const SEPARADOR = ";";

/** Reporte de eventos en CSV, con las mismas reglas que el de horas beca. */
export function generarCsvEventos(filas: FilaExportacionEvento[]): string {
  const lineas = [
    COLUMNAS_EXPORTACION_EVENTOS.map(escaparCampoCsv).join(SEPARADOR),
    ...filas.map((fila) => valoresDeFilaEvento(fila).map(escaparCampoCsv).join(SEPARADOR)),
  ];

  return MARCA_UTF8 + lineas.join("\r\n") + "\r\n";
}
