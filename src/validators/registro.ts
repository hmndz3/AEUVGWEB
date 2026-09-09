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

export function crearEsquemaRegistro(dominioInstitucional: string) {
  return z
    .object({
      nombreCompleto: z.string().trim().min(3).max(200),
      carnet: z
        .string()
        .trim()
        .regex(/^\d{5}$/, "El carnet debe contener exactamente 5 dígitos."),
      correo: z
        .string()
        .trim()
        .max(254)
        .email(mensajeCorreo)
        .refine((valor) => perteneceAlDominio(valor, dominioInstitucional), mensajeCorreo)
        .transform(normalizarCorreo),
      idFacultad: z.coerce.number().int().positive(),
      idCarrera: z.coerce.number().int().positive(),
      contrasena: reglasContrasena,
      confirmarContrasena: z.string(),
      aceptaTerminos: z.literal(true, {
        error: "Debes aceptar los términos y la política de privacidad.",
      }),
    })
    .refine((datos) => datos.contrasena === datos.confirmarContrasena, {
      message: "Las contraseñas no coinciden.",
      path: ["confirmarContrasena"],
    });
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
