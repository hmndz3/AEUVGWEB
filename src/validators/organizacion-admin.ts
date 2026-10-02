import { z } from "zod";

import { RUTA_IMAGEN_PROPIA } from "@/lib/imagenes/validacion-imagen";

const MENSAJE_NOMBRE = "El nombre debe tener entre 3 y 160 caracteres.";
const MENSAJE_CORREO = "Escribe un correo electrónico válido o deja el campo vacío.";
const MENSAJE_IMAGEN =
  "Escribe un enlace de imagen válido, por ejemplo https://ejemplo.com/logo.png.";

/** Campo de texto opcional: la cadena vacía del formulario equivale a no tener valor. */
const textoOpcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor.length > 0 ? valor : null))
    .nullable()
    .default(null);

/** Solo http y https: un enlace data: o javascript: no tiene lugar en una ficha. */
function esEnlaceSeguro(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const nombre = z.string(MENSAJE_NOMBRE).trim().min(3, MENSAJE_NOMBRE).max(160, MENSAJE_NOMBRE);

const correoOpcional = z
  .string(MENSAJE_CORREO)
  .trim()
  .max(254, MENSAJE_CORREO)
  .refine(
    (valor) => valor === "" || z.string().email(MENSAJE_CORREO).safeParse(valor).success,
    MENSAJE_CORREO
  )
  .transform((valor) => (valor === "" ? null : valor))
  .nullable()
  .default(null);

/**
 * Enlace de imagen opcional. Igual que en los eventos, pegar "ejemplo.com/x.png"
 * es lo normal, así que se completa el esquema en lugar de rechazar el enlace
 * por una razón que no le importa a nadie. Las imágenes subidas al volumen son
 * rutas del propio sitio y se dejan intactas.
 */
const imagenOpcional = z
  .string(MENSAJE_IMAGEN)
  .trim()
  .max(500, "El enlace de la imagen es demasiado largo.")
  .transform((valor) =>
    valor && !RUTA_IMAGEN_PROPIA.test(valor) && !/^[a-z][a-z0-9+.-]*:/i.test(valor)
      ? `https://${valor}`
      : valor
  )
  .refine(
    (valor) => valor === "" || RUTA_IMAGEN_PROPIA.test(valor) || esEnlaceSeguro(valor),
    MENSAJE_IMAGEN
  )
  .transform((valor) => (valor === "" ? null : valor))
  .nullable()
  .default(null);

export const esquemaAsociacionAdmin = z.object({
  nombre,
  descripcion: textoOpcional(5000, "La descripción no puede exceder 5000 caracteres."),
  mision: textoOpcional(2000, "La misión no puede exceder 2000 caracteres."),
  vision: textoOpcional(2000, "La visión no puede exceder 2000 caracteres."),
  correo: correoOpcional,
  informacionContacto: textoOpcional(
    2000,
    "La información de contacto no puede exceder 2000 caracteres."
  ),
  imagenUrl: imagenOpcional,
});

export type DatosAsociacionAdmin = z.infer<typeof esquemaAsociacionAdmin>;

/** Etiqueta legible de cada campo, para nombrar el primer error en el resumen. */
export const ETIQUETAS_CAMPO_ASOCIACION: Record<string, string> = {
  nombre: "Nombre",
  descripcion: "Descripción",
  mision: "Misión",
  vision: "Visión",
  correo: "Correo",
  informacionContacto: "Información de contacto",
  imagenUrl: "Imagen o logotipo",
};
