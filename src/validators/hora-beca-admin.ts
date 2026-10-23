import { z } from "zod";

import { normalizarCarnet } from "@/lib/horas-beca/busqueda-horas";
import { diaCalendario } from "@/lib/horas-beca/filtros-horas";
import { PATRON_HORARIO } from "@/lib/horas-beca/formato-horas";
import {
  MAXIMO_HORAS_POR_REGISTRO,
  MAXIMO_REGISTROS_EN_LOTE,
} from "@/lib/horas-beca/servicio-horas-beca";

const MENSAJE_CARNET = "El carnet debe tener entre 3 y 20 caracteres, sin espacios ni símbolos.";
const MENSAJE_NOMBRE = "El nombre del estudiante debe tener entre 3 y 200 caracteres.";
const MENSAJE_FECHA = "Indica la fecha en la que se realizó la actividad.";
const MENSAJE_HORARIO = "Indica la hora de inicio y la de fin del apoyo.";
const MENSAJE_HORARIO_INVERTIDO = "La hora de fin debe ser posterior a la de inicio.";
const MENSAJE_ACTIVIDAD = "Describe la actividad en la que se apoyó.";
const MENSAJE_HORAS = `La cantidad de horas debe ser mayor que cero, no exceder ${MAXIMO_HORAS_POR_REGISTRO} y tener como máximo dos decimales.`;

/**
 * Carnet del registro.
 *
 * El formulario de registro de cuentas exige cinco dígitos, pero aquí la regla
 * es más amplia a propósito: las hojas con las que AEUVG lleva el control
 * incluyen carnets de otras épocas, y rechazarlos dejaría fuera del sistema
 * justamente la información que este módulo viene a sustituir. Lo que sí se
 * garantiza es que se guarde normalizado, porque es el dato con el que el
 * registro encuentra la cuenta de su dueño.
 */
const carnet = z
  .string(MENSAJE_CARNET)
  .trim()
  .min(3, MENSAJE_CARNET)
  .max(20, MENSAJE_CARNET)
  .regex(/^[A-Za-z0-9-]+$/, MENSAJE_CARNET)
  .transform(normalizarCarnet);

/**
 * Cantidad de horas con dos decimales como máximo, que es la precisión de la
 * columna. Se comprueba antes de guardar para que un 1.333 no se redondee en
 * silencio y descuadre el total del estudiante.
 */
const cantidadHoras = z.coerce
  .number(MENSAJE_HORAS)
  .positive(MENSAJE_HORAS)
  .max(MAXIMO_HORAS_POR_REGISTRO, MENSAJE_HORAS)
  .refine(
    (valor) => Number.isInteger(Math.round(valor * 100)) && (valor * 100) % 1 === 0,
    MENSAJE_HORAS
  );

/** Campo de texto opcional: la cadena vacía del formulario equivale a no tener valor. */
const observaciones = z
  .string()
  .trim()
  .max(1000, "Las observaciones no pueden exceder 1000 caracteres.")
  .transform((valor) => (valor.length > 0 ? valor : null))
  .nullable()
  .default(null);

export const esquemaRegistroHoraAdmin = z.object({
  carnet,
  nombreEstudiante: z.string(MENSAJE_NOMBRE).trim().min(3, MENSAJE_NOMBRE).max(200, MENSAJE_NOMBRE),
  // La fecha llega como día de calendario y se convierte a la medianoche en UTC,
  // que es con la que PostgreSQL compara una columna `date`.
  fechaActividad: z
    .string(MENSAJE_FECHA)
    .regex(/^\d{4}-\d{2}-\d{2}$/, MENSAJE_FECHA)
    .transform(diaCalendario),
  /*
   * El horario dejó de escribirse a mano: el formulario lo arma con dos
   * selectores de hora y lo envía como "HH:MM-HH:MM". Validarlo aquí evita que
   * un cuerpo armado a mano reintroduzca el texto libre que hacía imposible
   * comparar o sumar horarios.
   */
  horarioApoyo: z
    .string(MENSAJE_HORARIO)
    .trim()
    .regex(PATRON_HORARIO, MENSAJE_HORARIO)
    .refine((valor) => {
      const [inicio, fin] = valor.split("-");
      return fin > inicio;
    }, MENSAJE_HORARIO_INVERTIDO),
  descripcionActividad: z
    .string(MENSAJE_ACTIVIDAD)
    .trim()
    .min(3, MENSAJE_ACTIVIDAD)
    .max(1000, "La descripción de la actividad no puede exceder 1000 caracteres."),
  cantidadHoras,
  observaciones,
});

export type DatosRegistroHoraAdmin = z.infer<typeof esquemaRegistroHoraAdmin>;

/** Etiqueta legible de cada campo, para nombrar el primer error en el resumen. */
export const ETIQUETAS_CAMPO_HORA_BECA: Record<string, string> = {
  carnet: "Carnet",
  nombreEstudiante: "Nombre del estudiante",
  fechaActividad: "Fecha de la actividad",
  horarioApoyo: "Horario de apoyo",
  descripcionActividad: "Actividad",
  cantidadHoras: "Cantidad de horas",
  observaciones: "Observaciones",
};

/** Acciones de la acreditación en lote. */
export const ACCIONES_ACREDITACION = ["acreditar", "revertir"] as const;

export type AccionAcreditacion = (typeof ACCIONES_ACREDITACION)[number];

/**
 * Cuerpo de una operación en lote.
 *
 * Los identificadores llegan como lista y no como rango o filtro: el panel
 * acredita exactamente lo que el administrador marcó, y traducir un filtro a
 * registros en el servidor podría alcanzar filas que ya no estaban en pantalla.
 */
export const esquemaAcreditacionLote = z.object({
  accion: z.enum(ACCIONES_ACREDITACION, "La acción debe ser acreditar o revertir."),
  ids: z
    .array(z.coerce.number().int().positive(), "Selecciona al menos un registro.")
    .min(1, "Selecciona al menos un registro.")
    .max(
      MAXIMO_REGISTROS_EN_LOTE,
      `No se pueden procesar más de ${MAXIMO_REGISTROS_EN_LOTE} registros a la vez.`
    ),
});

export type DatosAcreditacionLote = z.infer<typeof esquemaAcreditacionLote>;
