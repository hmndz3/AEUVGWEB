import { z } from "zod";

import { PATRON_HORA } from "@/lib/horas-beca/horario-oportunidad";

const MENSAJE_NOMBRE = "El nombre de la actividad debe tener entre 3 y 200 caracteres.";
const MENSAJE_DESCRIPCION = "Describe en qué consiste el apoyo, con al menos 10 caracteres.";
const MENSAJE_FECHA = "Indica la fecha en la que se realizará la actividad.";
const MENSAJE_HORA = "Indica la hora de inicio y la de fin.";
const MENSAJE_HORA_INVERTIDA = "La hora de fin debe ser posterior a la de inicio.";
const MENSAJE_LUGAR = "Indica dónde se realizará la actividad.";
const MENSAJE_PERSONAS = "La cantidad de personas debe ser un número entero mayor que cero.";

/** Personas que puede pedir una convocatoria. Más no es un apoyo, es un error de captura. */
export const MAXIMO_PERSONAS_OPORTUNIDAD = 500;

/** Estados por los que pasa una convocatoria, en el orden en que se recorren. */
export const ESTADOS_OPORTUNIDAD = [
  "BORRADOR",
  "PUBLICADA",
  "CERRADA",
  "CANCELADA",
  "FINALIZADA",
] as const;

export type EstadoOportunidadFiltro = (typeof ESTADOS_OPORTUNIDAD)[number];

export const ETIQUETAS_ESTADO_OPORTUNIDAD: Record<EstadoOportunidadFiltro, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
  FINALIZADA: "Finalizada",
};

/** Explicación de cada estado, para que el panel no obligue a adivinarla. */
export const DESCRIPCIONES_ESTADO_OPORTUNIDAD: Record<EstadoOportunidadFiltro, string> = {
  BORRADOR: "Todavía no se ve en el sitio.",
  PUBLICADA: "Visible para el estudiantado.",
  CERRADA: "Ya no admite más gente.",
  CANCELADA: "No se va a realizar.",
  FINALIZADA: "Ya se realizó.",
};

/** Cambios de estado que el panel ofrece como acción. */
export const ACCIONES_OPORTUNIDAD = ["publicar", "cerrar", "cancelar", "finalizar"] as const;

export type AccionOportunidad = (typeof ACCIONES_OPORTUNIDAD)[number];

/** Estado al que lleva cada acción. */
export const ESTADO_DE_ACCION: Record<AccionOportunidad, EstadoOportunidadFiltro> = {
  publicar: "PUBLICADA",
  cerrar: "CERRADA",
  cancelar: "CANCELADA",
  finalizar: "FINALIZADA",
};

export const ETIQUETAS_ACCION_OPORTUNIDAD: Record<AccionOportunidad, string> = {
  publicar: "Publicar",
  cerrar: "Cerrar",
  cancelar: "Cancelar",
  finalizar: "Marcar como finalizada",
};

const hora = z.string(MENSAJE_HORA).trim().regex(PATRON_HORA, MENSAJE_HORA);

/**
 * Convocatoria para realizar horas beca, tal como la envía el panel.
 *
 * La fecha se queda como día de calendario y las horas como horas de reloj,
 * igual que están en la base: la convocatoria no es un instante, es un día y un
 * horario, y convertirla a un instante obligaría a elegir una zona que nadie
 * pidió.
 *
 * El estado no viaja en el cuerpo. Una convocatoria nace como borrador y cambia
 * de estado por su propia operación, de modo que corregir una descripción no
 * pueda publicar sin querer lo que todavía se estaba preparando.
 */
export const esquemaOportunidadAdmin = z
  .object({
    nombre: z.string(MENSAJE_NOMBRE).trim().min(3, MENSAJE_NOMBRE).max(200, MENSAJE_NOMBRE),
    descripcion: z
      .string(MENSAJE_DESCRIPCION)
      .trim()
      .min(10, MENSAJE_DESCRIPCION)
      .max(2000, "La descripción no puede exceder 2000 caracteres."),
    fecha: z.string(MENSAJE_FECHA).regex(/^\d{4}-\d{2}-\d{2}$/, MENSAJE_FECHA),
    horaInicio: hora,
    horaFin: hora,
    lugar: z.string(MENSAJE_LUGAR).trim().min(3, MENSAJE_LUGAR).max(255, MENSAJE_LUGAR),
    cantidadPersonas: z.coerce
      .number(MENSAJE_PERSONAS)
      .int(MENSAJE_PERSONAS)
      .positive(MENSAJE_PERSONAS)
      .max(MAXIMO_PERSONAS_OPORTUNIDAD, MENSAJE_PERSONAS),
    informacionAdicional: z
      .string()
      .trim()
      .max(2000, "La información adicional no puede exceder 2000 caracteres.")
      .transform((valor) => (valor.length > 0 ? valor : null))
      .nullable()
      .default(null),
  })
  .superRefine((datos, contexto) => {
    // Se comprueba entre campos y no en cada hora por separado: un horario
    // invertido es correcto campo por campo y solo se ve al mirar los dos.
    if (datos.horaFin <= datos.horaInicio) {
      contexto.addIssue({
        code: "custom",
        path: ["horaFin"],
        message: MENSAJE_HORA_INVERTIDA,
      });
    }
  });

export type DatosOportunidadAdmin = z.infer<typeof esquemaOportunidadAdmin>;

/** Etiqueta legible de cada campo, para nombrar el error en el resumen. */
export const ETIQUETAS_CAMPO_OPORTUNIDAD: Record<string, string> = {
  nombre: "Actividad",
  descripcion: "Descripción",
  fecha: "Fecha",
  horaInicio: "Hora de inicio",
  horaFin: "Hora de fin",
  lugar: "Lugar",
  cantidadPersonas: "Cantidad de personas",
  informacionAdicional: "Información adicional",
};

/** Acción pedida en el cuerpo, o null si no se reconoce. */
export function interpretarAccionOportunidad(valor: unknown): AccionOportunidad | null {
  return ACCIONES_OPORTUNIDAD.find((accion) => accion === valor) ?? null;
}

/** Estado pedido en la dirección para filtrar el listado, o undefined. */
export function interpretarEstadoOportunidad(
  valor: string | string[] | undefined
): EstadoOportunidadFiltro | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (!texto) return undefined;

  return ESTADOS_OPORTUNIDAD.find((estado) => estado === texto.toUpperCase());
}
