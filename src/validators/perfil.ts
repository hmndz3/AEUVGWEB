import { z } from "zod";

const MENSAJE_TELEFONO = "El teléfono debe tener 8 dígitos, por ejemplo 5555 4444.";

/**
 * Teléfono de Guatemala, con prefijo de país opcional y separadores libres.
 *
 * Se valida el formato y se guarda tal como lo escribió el estudiante: la
 * plataforma solo lo muestra, nunca marca desde ella, y normalizarlo le quitaría
 * el formato con el que su dueño lo reconoce.
 */
const telefono = z
  .string(MENSAJE_TELEFONO)
  .trim()
  .max(30, MENSAJE_TELEFONO)
  .refine(
    (valor) => valor === "" || /^(\+?502[\s-]?)?\d{4}[\s-]?\d{4}$/.test(valor),
    MENSAJE_TELEFONO
  )
  .transform((valor) => (valor === "" ? null : valor.replace(/\s+/g, " ")))
  .nullable()
  .default(null);

/**
 * Datos que el estudiante puede cambiar de su perfil.
 *
 * El carnet, el nombre y el correo institucional quedan fuera a propósito:
 * identifican la cuenta, se usan para asociar los registros de horas beca y su
 * corrección corresponde a AEUVG, no a quien la usa.
 */
export const esquemaPerfil = z.object({
  telefono,
  idCarrera: z.coerce
    .number("Selecciona tu carrera.")
    .int("Selecciona tu carrera.")
    .positive("Selecciona tu carrera."),
});

export type DatosPerfil = z.infer<typeof esquemaPerfil>;

export const ETIQUETAS_CAMPO_PERFIL: Record<string, string> = {
  telefono: "Teléfono",
  idCarrera: "Carrera",
};
