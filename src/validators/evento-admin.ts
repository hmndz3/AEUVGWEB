import { z } from "zod";

import { TIPOS_ACTIVIDAD } from "@/validators/eventos";

const MENSAJE_NOMBRE = "El nombre del evento debe tener entre 5 y 200 caracteres.";
const MENSAJE_DESCRIPCION = "La descripción debe tener al menos 20 caracteres.";

/** Campo de texto opcional: la cadena vacía del formulario equivale a no tener valor. */
const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null);

const identificadorOpcional = z
  .union([z.literal(""), z.coerce.number().int().positive()])
  .transform((valor) => (valor === "" ? null : valor))
  .nullable()
  .default(null);

const fecha = z.coerce.date("Indica una fecha y hora válidas.");

export const esquemaEventoAdmin = z
  .object({
    nombre: z.string().trim().min(5, MENSAJE_NOMBRE).max(200, MENSAJE_NOMBRE),
    descripcion: z.string().trim().min(20, MENSAJE_DESCRIPCION).max(5000),
    idCategoriaEvento: z.coerce.number("Selecciona una categoría.").int().positive(),
    tipoActividad: z.enum(TIPOS_ACTIVIDAD, "Selecciona el tipo de actividad."),
    fechaInicio: fecha,
    fechaFin: fecha,
    ubicacion: z.string().trim().min(3, "Indica dónde se realiza el evento.").max(255),
    cupo: z
      .union([z.literal(""), z.coerce.number().int().positive().max(100000)])
      .transform((valor) => (valor === "" ? null : valor))
      .nullable()
      .default(null),
    informacionAdicional: textoOpcional(2000),
    imagenUrl: z
      .union([z.literal(""), z.url("La dirección de la imagen no es válida.").max(500)])
      .transform((valor) => (valor === "" ? null : valor))
      .nullable()
      .default(null),
    destacado: z.coerce.boolean().default(false),
    idAsociacion: identificadorOpcional,
    idClub: identificadorOpcional,
    unidadUvg: textoOpcional(160),
  })
  .refine((datos) => datos.fechaFin.getTime() >= datos.fechaInicio.getTime(), {
    message: "La fecha de finalización no puede ser anterior a la de inicio.",
    path: ["fechaFin"],
  })
  .refine((datos) => Boolean(datos.idAsociacion || datos.idClub || datos.unidadUvg), {
    // Sin organizador el estudiante no sabe a quién corresponde la actividad,
    // que es justo lo que AEUVG pidió dejar claro en cada evento.
    message: "Indica al menos un organizador: una asociación, un club o una unidad de UVG.",
    path: ["idAsociacion"],
  });

export type DatosEventoAdmin = z.infer<typeof esquemaEventoAdmin>;

/** Traduce los errores de Zod a un mapa campo/mensaje para el formulario. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};

  for (const problema of error.issues) {
    const campo = problema.path.join(".") || "general";
    errores[campo] ??= problema.message;
  }

  return errores;
}
