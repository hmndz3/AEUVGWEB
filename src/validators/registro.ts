import { z } from "zod";

const mensajeCorreo = "Ingresa un correo institucional válido.";

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLocaleLowerCase("en-US");
}

export function perteneceAlDominio(correo: string, dominio: string): boolean {
  const correoNormalizado = normalizarCorreo(correo);
  const dominioNormalizado = dominio.trim().toLocaleLowerCase("en-US").replace(/^@/, "");
  const partes = correoNormalizado.split("@");

  return partes.length === 2 && partes[0].length > 0 && partes[1] === dominioNormalizado;
}

export const reglasContrasena = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128, "La contraseña no puede exceder 128 caracteres.")
  .regex(/[a-záéíóúñ]/u, "Incluye al menos una letra minúscula.")
  .regex(/[A-ZÁÉÍÓÚÑ]/u, "Incluye al menos una letra mayúscula.")
  .regex(/\d/u, "Incluye al menos un número.")
  .regex(/[^\p{L}\p{N}\s]/u, "Incluye al menos un símbolo.");

const mensajeNombres = "Escribe tus nombres, entre 2 y 100 caracteres.";
const mensajeApellidos = "Escribe tus apellidos, entre 2 y 100 caracteres.";

// Se aceptan letras con tilde, la eñe, espacios, apóstrofos y guiones, que
// aparecen en apellidos compuestos. Se rechazan dígitos y símbolos, que en un
// nombre casi siempre indican un error de captura.
const LETRAS_DE_NOMBRE = /^[\p{L}][\p{L}\s'’-]*$/u;

const nombrePersona = (mensaje: string) =>
  z
    .string(mensaje)
    .trim()
    .min(2, mensaje)
    .max(100, mensaje)
    .regex(LETRAS_DE_NOMBRE, "Usa solo letras, espacios, apóstrofos o guiones.")
    // Varios espacios seguidos se reducen a uno para guardar el nombre limpio.
    .transform((valor) => valor.replace(/\s+/g, " "));

export function crearEsquemaRegistro(dominioInstitucional: string) {
  return (
    z
      .object({
        nombres: nombrePersona(mensajeNombres),
        apellidos: nombrePersona(mensajeApellidos),
        carnet: z
          .string("El carnet debe contener exactamente 5 dígitos.")
          .trim()
          .regex(/^\d{5}$/, "El carnet debe contener exactamente 5 dígitos."),
        correo: z
          .string(mensajeCorreo)
          .trim()
          .max(254, mensajeCorreo)
          .email(mensajeCorreo)
          .refine((valor) => perteneceAlDominio(valor, dominioInstitucional), mensajeCorreo)
          .transform(normalizarCorreo),
        idFacultad: z.coerce
          .number("Selecciona tu facultad.")
          .int("Selecciona tu facultad.")
          .positive("Selecciona tu facultad."),
        idCarrera: z.coerce
          .number("Selecciona tu carrera.")
          .int("Selecciona tu carrera.")
          .positive("Selecciona tu carrera."),
        contrasena: reglasContrasena,
        confirmarContrasena: z.string("Vuelve a escribir la contraseña."),
        aceptaTerminos: z.literal(true, {
          error: "Debes aceptar los términos y la política de privacidad.",
        }),
      })
      .refine((datos) => datos.contrasena === datos.confirmarContrasena, {
        message: "Las contraseñas no coinciden.",
        path: ["confirmarContrasena"],
      })
      // El nombre se captura separado porque así lo escribe la persona, pero se
      // guarda compuesto: es un solo campo en la base y así lo leen el encabezado,
      // los correos y el panel administrativo.
      .transform((datos) => ({
        ...datos,
        nombreCompleto: `${datos.nombres} ${datos.apellidos}`,
      }))
  );
}

export function crearEsquemaReenvio(dominioInstitucional: string) {
  return z.object({
    correo: z
      .string()
      .trim()
      .max(254)
      .email(mensajeCorreo)
      .refine((valor) => perteneceAlDominio(valor, dominioInstitucional), mensajeCorreo)
      .transform(normalizarCorreo),
  });
}

export const esquemaVerificacionCorreo = z.object({
  token: z
    .string()
    .min(32)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
});

export type DatosRegistro = z.infer<ReturnType<typeof crearEsquemaRegistro>>;
