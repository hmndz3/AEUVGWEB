import { z } from "zod";

import { TIPOS_ACTIVIDAD } from "@/validators/eventos";

const MENSAJE_NOMBRE = "El nombre del evento debe tener entre 5 y 200 caracteres.";
const MENSAJE_DESCRIPCION = "La descripción debe tener entre 20 y 5000 caracteres.";

/** Campo de texto opcional: la cadena vacía del formulario equivale a no tener valor. */
const textoOpcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null);

const identificadorOpcional = (mensaje: string) =>
  z
    .union([z.literal(""), z.coerce.number(mensaje).int(mensaje).positive(mensaje)], mensaje)
    .transform((valor) => (valor === "" ? null : valor))
    .nullable()
    .default(null);

const MENSAJE_IMAGEN = "Escribe un enlace de imagen válido, por ejemplo https://ejemplo.com/foto.jpg.";

/** Solo http y https: un enlace data: o javascript: no tiene lugar en un evento. */
function esEnlaceDeImagen(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const fecha = z.coerce.date("Indica una fecha y una hora válidas.");

export const esquemaEventoAdmin = z
  .object({
    nombre: z.string(MENSAJE_NOMBRE).trim().min(5, MENSAJE_NOMBRE).max(200, MENSAJE_NOMBRE),
    descripcion: z
      .string(MENSAJE_DESCRIPCION)
      .trim()
      .min(20, MENSAJE_DESCRIPCION)
      .max(5000, MENSAJE_DESCRIPCION),
    idCategoriaEvento: z.coerce
      .number("Selecciona una categoría.")
      .int("Selecciona una categoría.")
      .positive("Selecciona una categoría."),
    tipoActividad: z.enum(TIPOS_ACTIVIDAD, "Selecciona el tipo de actividad."),
    fechaInicio: fecha,
    fechaFin: fecha,
    ubicacion: z
      .string("Indica dónde se realiza el evento.")
      .trim()
      .min(3, "Indica dónde se realiza el evento.")
      .max(255, "La ubicación no puede exceder 255 caracteres."),
    cupo: z
      .union(
        [
          z.literal(""),
          z.coerce
            .number("El cupo debe ser un número entero mayor que cero.")
            .int("El cupo debe ser un número entero mayor que cero.")
            .positive("El cupo debe ser un número entero mayor que cero.")
            .max(100000, "El cupo no puede superar las 100,000 personas."),
        ],
        "El cupo debe ser un número entero mayor que cero."
      )
      .transform((valor) => (valor === "" ? null : valor))
      .nullable()
      .default(null),
    informacionAdicional: textoOpcional(
      2000,
      "La información adicional no puede exceder 2000 caracteres."
    ),
    imagenUrl: z
      .string(MENSAJE_IMAGEN)
      .trim()
      .max(500, "El enlace de la imagen es demasiado largo.")
      // Pegar "ejemplo.com/foto.jpg" es lo normal; se completa el esquema en
      // lugar de rechazar el enlace por una razón que no le importa a nadie.
      .transform((valor) => (valor && !/^[a-z][a-z0-9+.-]*:/i.test(valor) ? `https://${valor}` : valor))
      .refine((valor) => valor === "" || esEnlaceDeImagen(valor), MENSAJE_IMAGEN)
      .transform((valor) => (valor === "" ? null : valor))
      .nullable()
      .default(null),
    destacado: z.coerce.boolean().default(false),
    // Los organizadores son opcionales: AEUVG publica actividades propias que no
    // corresponden a ninguna asociación ni club, y exigir uno obligaba a inventar
    // un organizador solo para poder guardar el evento.
    idAsociacion: identificadorOpcional("Selecciona una asociación válida."),
    idClub: identificadorOpcional("Selecciona un club válido."),
    unidadUvg: textoOpcional(160, "El nombre de la unidad no puede exceder 160 caracteres."),
  })
  .refine((datos) => datos.fechaFin.getTime() >= datos.fechaInicio.getTime(), {
    message: "La fecha de finalización no puede ser anterior a la de inicio.",
    path: ["fechaFin"],
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

/** Etiqueta legible de cada campo, para nombrar el primer error en el resumen. */
export const ETIQUETAS_CAMPO_EVENTO: Record<string, string> = {
  nombre: "Nombre del evento",
  descripcion: "Descripción",
  idCategoriaEvento: "Categoría",
  tipoActividad: "Tipo de actividad",
  fechaInicio: "Inicio",
  fechaFin: "Finalización",
  ubicacion: "Ubicación",
  cupo: "Cupo",
  informacionAdicional: "Información adicional",
  imagenUrl: "Imagen del evento",
  idAsociacion: "Asociación",
  idClub: "Club",
  unidadUvg: "Unidad de UVG",
};
