import { z } from "zod";

import { normalizarCarnet } from "@/lib/horas-beca/busqueda-horas";
import { TALLAS, TIPOS_ARTICULO } from "@/lib/prestamo-batas/formato-prestamo-batas";
import { DIAS_SEMANA, PATRON_HORA } from "@/lib/tutorias/formato-tutorias";

/**
 * Esquemas del préstamo de batas y el voluntariado.
 *
 * Son el punto único de verdad que comparten los formularios (cliente) y los
 * endpoints (servidor), como el resto del proyecto. Las reglas entre campos
 * —un horario invertido, una talla que sobra en los lentes— se comprueban aquí
 * con `superRefine`, porque son correctas campo por campo y solo se ven al
 * mirar varios juntos.
 */

const MENSAJE_HORA = "Indica la hora en formato de 24 horas, por ejemplo 14:30.";
const MENSAJE_HORA_INVERTIDA = "La hora de fin debe ser posterior a la de inicio.";
const MENSAJE_FECHA = "Elige una fecha válida.";
const MENSAJE_CARNET = "Escribe el carné, de 1 a 20 caracteres.";
const MENSAJE_CORREO = "Escribe un correo válido o déjalo vacío.";

/** Postulación más larga que caben turnos tiene: todos los de la semana, con holgura. */
export const MAXIMO_TURNOS_POSTULACION = 40;

const identificador = z.coerce.number().int().positive();
const hora = z.string(MENSAJE_HORA).trim().regex(PATRON_HORA, MENSAJE_HORA);
const fecha = z.string(MENSAJE_FECHA).regex(/^\d{4}-\d{2}-\d{2}$/, MENSAJE_FECHA);

/** Un texto opcional: vacío equivale a no haberlo escrito. */
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.preprocess(
    (valor) =>
      valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "")
        ? null
        : valor,
    esquema.nullable()
  );

const comentario = (maximo = 1000) =>
  z
    .string()
    .trim()
    .max(maximo, `El comentario no puede exceder ${maximo} caracteres.`)
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null);

const nombrePersona = (etiqueta: string) =>
  z
    .string(`Escribe ${etiqueta}.`)
    .trim()
    .min(1, `Escribe ${etiqueta}.`)
    .max(120, `${etiqueta} no puede exceder 120 caracteres.`)
    .transform((valor) => valor.replace(/\s+/g, " "));

const carnet = z
  .string(MENSAJE_CARNET)
  .trim()
  .min(1, MENSAJE_CARNET)
  .max(20, MENSAJE_CARNET)
  .transform(normalizarCarnet);

const correoOpcional = opcional(
  z.email(MENSAJE_CORREO).max(254, MENSAJE_CORREO).toLowerCase()
).default(null);

const telefonoOpcional = opcional(
  z.string().trim().max(30, "El teléfono no puede exceder 30 caracteres.")
).default(null);

// --- Turnos (catálogo que gestiona el administrador) --------------------------

/**
 * Un turno de atención del salón. El cupo no se captura: el proceso de AEUVG es
 * de dos voluntarios y el valor por defecto de la tabla ya lo fija.
 */
export const esquemaTurno = z
  .object({
    diaSemana: z.enum(DIAS_SEMANA, "Elige el día de la semana."),
    horaInicio: hora,
    horaFin: hora,
    activo: z.boolean("Indica si el turno está activo.").default(true),
  })
  .superRefine((datos, contexto) => {
    if (datos.horaFin <= datos.horaInicio) {
      contexto.addIssue({ code: "custom", path: ["horaFin"], message: MENSAJE_HORA_INVERTIDA });
    }
  });

export type DatosTurno = z.infer<typeof esquemaTurno>;

// --- Inventario ---------------------------------------------------------------

/**
 * Un artículo del inventario. Las batas llevan talla y los lentes no: son el
 * mismo par para todos, así que una talla en los lentes es un error de captura.
 */
export const esquemaArticuloInventario = z
  .object({
    tipo: z.enum(TIPOS_ARTICULO, "Elige el tipo de artículo."),
    talla: opcional(z.enum(TALLAS, "Elige una talla válida.")).default(null),
    cantidadTotal: z.coerce
      .number("Indica la cantidad.")
      .int("La cantidad debe ser un número entero.")
      .min(0, "La cantidad no puede ser negativa.")
      .max(100000, "La cantidad es demasiado alta."),
    activo: z.boolean().default(true),
  })
  .superRefine((datos, contexto) => {
    if (datos.tipo === "LENTES" && datos.talla !== null) {
      contexto.addIssue({
        code: "custom",
        path: ["talla"],
        message: "Los lentes no llevan talla.",
      });
    }
    if (datos.tipo !== "LENTES" && datos.talla === null) {
      contexto.addIssue({
        code: "custom",
        path: ["talla"],
        message: "Elige la talla de la bata.",
      });
    }
  });

export type DatosArticuloInventario = z.infer<typeof esquemaArticuloInventario>;

// --- Préstamo -----------------------------------------------------------------

/** Una línea del préstamo: un artículo del inventario y cuántos se prestan. */
export const esquemaArticuloPrestado = z.object({
  idArticulo: identificador,
  cantidad: z.coerce
    .number("Indica la cantidad.")
    .int("La cantidad debe ser un número entero.")
    .min(1, "Presta al menos uno.")
    .max(50, "Son demasiados para un solo préstamo."),
});

/**
 * Un préstamo tal como lo registra el voluntario. Los datos de la persona se
 * escriben libres —como en el Excel actual— porque quien presta una bata puede
 * no tener todavía cuenta en la plataforma.
 */
export const esquemaPrestamo = z.object({
  nombre: nombrePersona("el nombre"),
  apellido: nombrePersona("el apellido"),
  carnet,
  correo: correoOpcional,
  telefono: telefonoOpcional,
  fechaPrestamo: fecha,
  horaSalida: hora,
  horaEntregaEstimada: opcional(hora).default(null),
  comentarios: comentario(500),
  articulos: z
    .array(esquemaArticuloPrestado, "Elige al menos un artículo para prestar.")
    .min(1, "Elige al menos un artículo para prestar.")
    .max(10, "Son demasiados artículos para un solo préstamo.")
    .refine(
      (articulos) => new Set(articulos.map((a) => a.idArticulo)).size === articulos.length,
      "Hay un artículo repetido en el préstamo."
    ),
});

export type DatosPrestamo = z.infer<typeof esquemaPrestamo>;

/** Nota opcional al marcar la devolución de un préstamo. */
export const esquemaDevolucion = z.object({
  comentarios: comentario(500),
});

export type DatosDevolucion = z.infer<typeof esquemaDevolucion>;

// --- Lista negra --------------------------------------------------------------

/**
 * Una entrada de la lista negra. Solo el nombre y la justificación son
 * obligatorios: cuando no se devuelve una bata, varios datos pueden quedar como
 * desconocidos, tal como ocurría en la hoja de cálculo.
 */
export const esquemaListaNegra = z.object({
  fecha: opcional(fecha).default(null),
  nombre: nombrePersona("el nombre"),
  apellido: opcional(nombrePersona("el apellido")).default(null),
  correo: correoOpcional,
  carnet: opcional(carnet).default(null),
  telefono: telefonoOpcional,
  justificacion: z
    .string("Escribe la justificación.")
    .trim()
    .min(1, "Escribe la justificación.")
    .max(1000, "La justificación no puede exceder 1000 caracteres."),
});

export type DatosListaNegra = z.infer<typeof esquemaListaNegra>;

// --- Postulación de voluntario ------------------------------------------------

/**
 * Postulación para ser voluntario. El estudiante no viaja en el cuerpo: sale de
 * la sesión, de modo que nadie postule a otra persona. Elige los turnos a los
 * que está disponible para atender.
 */
export const esquemaPostulacionVoluntario = z.object({
  comentarioSolicitante: comentario(1000),
  idsTurnos: z
    .array(identificador, "Elige al menos un turno al que puedas atender.")
    .min(1, "Elige al menos un turno al que puedas atender.")
    .max(MAXIMO_TURNOS_POSTULACION, "Elegiste demasiados turnos.")
    .refine((ids) => new Set(ids).size === ids.length, "Hay un turno repetido en la postulación."),
});

export type DatosPostulacionVoluntario = z.infer<typeof esquemaPostulacionVoluntario>;

/**
 * Revisión de una postulación de voluntario. Al aprobar, el administrador indica
 * a qué turnos concretos asigna al estudiante (un subconjunto de los que pidió,
 * respetando el cupo de cada uno).
 */
export const esquemaRevisionPostulacionVoluntario = z
  .object({
    decision: z.enum(["aprobar", "rechazar"], "Indica si se aprueba o se rechaza."),
    idsTurnos: z
      .array(identificador)
      .max(MAXIMO_TURNOS_POSTULACION, "Elegiste demasiados turnos.")
      .default([])
      .refine((ids) => new Set(ids).size === ids.length, "Hay un turno repetido."),
    comentarioRevision: comentario(1000),
  })
  .superRefine((datos, contexto) => {
    if (datos.decision === "aprobar" && datos.idsTurnos.length === 0) {
      contexto.addIssue({
        code: "custom",
        path: ["idsTurnos"],
        message: "Elige al menos un turno para asignar al voluntario.",
      });
    }
  });

export type DatosRevisionPostulacionVoluntario = z.infer<
  typeof esquemaRevisionPostulacionVoluntario
>;

// --- Comprobante de entrada y salida ------------------------------------------

/**
 * Comprobante de entrada y salida de un turno. El voluntario reporta a qué turno
 * atendió, en qué fecha, y sus horas de entrada y salida; con él se le acreditan
 * las horas beca tras la revisión del administrador.
 */
export const esquemaComprobanteTurno = z
  .object({
    idTurno: identificador,
    fecha,
    horaEntrada: hora,
    horaSalida: hora,
    comentarioVoluntario: comentario(500),
  })
  .superRefine((datos, contexto) => {
    if (datos.horaSalida <= datos.horaEntrada) {
      contexto.addIssue({
        code: "custom",
        path: ["horaSalida"],
        message: "La hora de salida debe ser posterior a la de entrada.",
      });
    }
  });

export type DatosComprobanteTurno = z.infer<typeof esquemaComprobanteTurno>;

/** Revisión de un comprobante por parte del administrador. */
export const esquemaRevisionComprobante = z.object({
  decision: z.enum(["aprobar", "rechazar"], "Indica si se aprueba o se rechaza."),
  comentarioRevision: comentario(1000),
});

export type DatosRevisionComprobante = z.infer<typeof esquemaRevisionComprobante>;

/** Etiqueta legible de cada campo, para nombrar el error en el resumen. */
export const ETIQUETAS_CAMPO_PRESTAMO: Record<string, string> = {
  diaSemana: "Día",
  horaInicio: "Hora de inicio",
  horaFin: "Hora de fin",
  activo: "Activo",
  tipo: "Tipo de artículo",
  talla: "Talla",
  cantidadTotal: "Cantidad",
  nombre: "Nombre",
  apellido: "Apellido",
  carnet: "Carné",
  correo: "Correo",
  telefono: "Teléfono",
  fechaPrestamo: "Fecha",
  horaSalida: "Hora de salida",
  horaEntregaEstimada: "Hora de entrega estimada",
  comentarios: "Comentarios",
  articulos: "Artículos",
  fecha: "Fecha",
  justificacion: "Justificación",
  comentarioSolicitante: "Comentario",
  idsTurnos: "Turnos",
  idTurno: "Turno",
  horaEntrada: "Hora de entrada",
  comentarioVoluntario: "Comentario",
  comentarioRevision: "Comentario de revisión",
  decision: "Decisión",
};
