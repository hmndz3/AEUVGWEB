import { z } from "zod";

import { DIAS_SEMANA, MODALIDADES, PATRON_HORA } from "@/lib/tutorias/formato-tutorias";
import { esImagenDelSitio } from "@/lib/imagenes/validacion-imagen";

const MENSAJE_CURSOS = "Elige al menos un curso que quieras impartir.";
const MENSAJE_NOTA = "La nota debe estar entre 0 y 100, con dos decimales como máximo.";
const MENSAJE_COMPROBANTE =
  "Adjunta el comprobante de la nota. Debe ser una imagen subida desde esta pantalla.";
const MENSAJE_HORA = "Indica la hora de inicio y la de fin.";
const MENSAJE_HORA_INVERTIDA = "La hora de fin debe ser posterior a la de inicio.";
const MENSAJE_ENLACE = "Indica dónde o por qué medio se realizará la tutoría.";

/** Cursos que puede incluir una postulación. Más no es una postulación, es una lista. */
export const MAXIMO_CURSOS_POSTULACION = 8;

/** Nota mínima con la que AEUVG admite a alguien como tutor de un curso. */
export const NOTA_MINIMA_TUTOR = 80;

const identificador = z.coerce.number().int().positive();

const hora = z.string(MENSAJE_HORA).trim().regex(PATRON_HORA, MENSAJE_HORA);

/**
 * Un curso de la postulación, con la nota que lo respalda y su comprobante.
 *
 * El comprobante es obligatorio y tiene que ser una imagen subida en esta misma
 * pantalla: la nota la declara quien se postula, y sin algo que la respalde la
 * revisión de AEUVG no tendría con qué contrastarla.
 */
export const esquemaCursoPostulacion = z.object({
  idCurso: identificador,
  notaObtenida: z.coerce
    .number(MENSAJE_NOTA)
    .min(0, MENSAJE_NOTA)
    .max(100, MENSAJE_NOTA)
    .refine((valor) => Number.isInteger(Math.round(valor * 100)), MENSAJE_NOTA),
  comprobanteUrl: z
    .string(MENSAJE_COMPROBANTE)
    .trim()
    .max(500, MENSAJE_COMPROBANTE)
    .refine(esImagenDelSitio, MENSAJE_COMPROBANTE),
});

export type DatosCursoPostulacion = z.infer<typeof esquemaCursoPostulacion>;

/**
 * Postulación para ser tutor.
 *
 * El estudiante no viaja en el cuerpo: sale de la sesión. De otro modo
 * cualquiera podría postular a otra persona.
 */
export const esquemaPostulacionTutor = z.object({
  comentarioSolicitante: z
    .string()
    .trim()
    .max(1000, "El comentario no puede exceder 1000 caracteres.")
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null),
  cursos: z
    .array(esquemaCursoPostulacion, MENSAJE_CURSOS)
    .min(1, MENSAJE_CURSOS)
    .max(
      MAXIMO_CURSOS_POSTULACION,
      `No puedes postularte a más de ${MAXIMO_CURSOS_POSTULACION} cursos.`
    )
    .refine(
      (cursos) => new Set(cursos.map((curso) => curso.idCurso)).size === cursos.length,
      "Hay un curso repetido en la postulación."
    ),
});

export type DatosPostulacionTutor = z.infer<typeof esquemaPostulacionTutor>;

/** Revisión de una postulación por parte de AEUVG. */
export const esquemaRevisionPostulacion = z.object({
  decision: z.enum(["aprobar", "rechazar"], "Indica si la postulación se aprueba o se rechaza."),
  comentarioRevision: z
    .string()
    .trim()
    .max(1000, "El comentario no puede exceder 1000 caracteres.")
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null),
});

export type DatosRevisionPostulacion = z.infer<typeof esquemaRevisionPostulacion>;

/** Ficha pública del tutor, que el propio tutor mantiene. */
export const esquemaFichaTutor = z.object({
  descripcion: z
    .string()
    .trim()
    .max(1000, "La descripción no puede exceder 1000 caracteres.")
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null),
  informacionContacto: z
    .string()
    .trim()
    .max(500, "La información de contacto no puede exceder 500 caracteres.")
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null),
});

export type DatosFichaTutor = z.infer<typeof esquemaFichaTutor>;

/**
 * Una franja de disponibilidad del tutor.
 *
 * El enlace o la ubicación se exigen según la modalidad: una tutoría virtual
 * sin enlace y una presencial sin lugar dejan al estudiante sin saber a dónde
 * ir, que es el único dato que la franja tiene que resolver.
 */
export const esquemaDisponibilidad = z
  .object({
    diaSemana: z.enum(DIAS_SEMANA, "Elige el día de la semana."),
    horaInicio: hora,
    horaFin: hora,
    modalidad: z.enum(MODALIDADES, "Elige la modalidad de la tutoría."),
    ubicacionEnlace: z
      .string()
      .trim()
      .max(500, "La ubicación o el enlace no pueden exceder 500 caracteres.")
      .transform((valor) => (valor.length > 0 ? valor : null))
      .nullable()
      .default(null),
  })
  .superRefine((datos, contexto) => {
    // Se comprueba entre campos: un horario invertido es correcto campo por
    // campo y solo se ve al mirar los dos juntos.
    if (datos.horaFin <= datos.horaInicio) {
      contexto.addIssue({ code: "custom", path: ["horaFin"], message: MENSAJE_HORA_INVERTIDA });
    }
    if (datos.ubicacionEnlace === null) {
      contexto.addIssue({ code: "custom", path: ["ubicacionEnlace"], message: MENSAJE_ENLACE });
    }
  });

export type DatosDisponibilidad = z.infer<typeof esquemaDisponibilidad>;

/**
 * Solicitud de una tutoría por parte del estudiante.
 *
 * La fecha y la hora llegan por separado y el servicio las une en el instante
 * que guarda la tabla: el estudiante elige un día del calendario y una franja
 * de la disponibilidad del tutor, no un instante con zona horaria.
 */
export const esquemaSolicitudTutoria = z.object({
  idTutor: identificador,
  idCurso: identificador,
  fecha: z
    .string("Elige el día de la tutoría.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige el día de la tutoría."),
  horaInicio: hora,
  horaFin: hora,
  modalidad: z.enum(MODALIDADES, "Elige la modalidad de la tutoría."),
  observaciones: z
    .string()
    .trim()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres.")
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null),
});

export type DatosSolicitudTutoria = z.infer<typeof esquemaSolicitudTutoria>;

/** Cambios de estado que admite una tutoría ya programada. */
export const ACCIONES_TUTORIA = ["completar", "cancelar"] as const;

export type AccionTutoria = (typeof ACCIONES_TUTORIA)[number];

export function interpretarAccionTutoria(valor: unknown): AccionTutoria | null {
  return ACCIONES_TUTORIA.find((accion) => accion === valor) ?? null;
}

/** Etiqueta legible de cada campo, para nombrar el error en el resumen. */
export const ETIQUETAS_CAMPO_TUTORIA: Record<string, string> = {
  cursos: "Cursos",
  comentarioSolicitante: "Comentario",
  notaObtenida: "Nota",
  comprobanteUrl: "Comprobante",
  descripcion: "Descripción",
  informacionContacto: "Información de contacto",
  diaSemana: "Día",
  horaInicio: "Hora de inicio",
  horaFin: "Hora de fin",
  modalidad: "Modalidad",
  ubicacionEnlace: "Lugar o enlace",
  fecha: "Fecha",
  idTutor: "Tutor",
  idCurso: "Curso",
  observaciones: "Observaciones",
};
