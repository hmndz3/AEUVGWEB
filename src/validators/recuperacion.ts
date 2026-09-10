import { z } from "zod";

import { normalizarCorreo, perteneceAlDominio, reglasContrasena } from "@/validators/registro";

const mensajeCorreo = "Ingresa un correo institucional válido.";

export function crearEsquemaSolicitudRecuperacion(dominioInstitucional: string) {
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

export const esquemaRestablecerContrasena = z
  .object({
    token: z.string().trim().min(1, "El enlace no es válido."),
    contrasena: reglasContrasena,
    confirmarContrasena: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.confirmarContrasena, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmarContrasena"],
  });

export type DatosRestablecerContrasena = z.infer<typeof esquemaRestablecerContrasena>;
