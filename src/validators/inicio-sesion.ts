import { z } from "zod";

import { normalizarCorreo, perteneceAlDominio } from "@/validators/registro";

export function crearEsquemaInicioSesion(dominioInstitucional: string) {
  return z.object({
    correo: z
      .string()
      .trim()
      .max(254)
      .email("Ingresa un correo institucional válido.")
      .refine(
        (valor) => perteneceAlDominio(valor, dominioInstitucional),
        "Ingresa un correo institucional válido."
      )
      .transform(normalizarCorreo),
    contrasena: z.string().min(1, "Ingresa tu contraseña.").max(128),
  });
}

export type DatosInicioSesion = z.infer<ReturnType<typeof crearEsquemaInicioSesion>>;
