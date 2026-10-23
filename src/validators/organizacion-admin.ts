import { z } from "zod";

import { esImagenDelSitio } from "@/lib/imagenes/validacion-imagen";
import { erroresPorCampo } from "@/validators/errores";

/**
 * Las dos secciones del panel comparten operaciones, así que comparten también
 * su grupo de endpoints: el tipo viaja en la dirección y es lo único que cambia
 * entre administrar una asociación y administrar un club.
 */
export const TIPOS_ORGANIZACION = ["asociaciones", "clubes"] as const;

export type TipoOrganizacion = (typeof TIPOS_ORGANIZACION)[number];

export function interpretarTipoOrganizacion(valor: string): TipoOrganizacion | null {
  return TIPOS_ORGANIZACION.find((tipo) => tipo === valor) ?? null;
}

export const ETIQUETA_TIPO: Record<TipoOrganizacion, { singular: string; plural: string }> = {
  asociaciones: { singular: "asociación", plural: "asociaciones" },
  clubes: { singular: "club", plural: "clubes" },
};

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

const MENSAJE_SIGLAS = "Las siglas deben tener entre 2 y 30 caracteres.";
const MENSAJE_TELEFONO = "Escribe un teléfono de 8 dígitos, por ejemplo 5555 4444.";
const MENSAJE_CONTACTO = "Indica al menos un medio de contacto: el correo o el teléfono.";

/**
 * Siglas o nombre corto de una asociación, por ejemplo AECCTIUVG. Es opcional
 * y se guarda tal como se escribe: puede ser un acrónimo o un nombre abreviado
 * ("Química UVG"), así que no se fuerzan mayúsculas.
 */
/**
 * Siglas o nombre corto. AEUVG las pidió obligatorias: son el nombre con el que
 * el estudiantado conoce a cada asociación, y sin ellas las tarjetas del listado
 * quedaban con el nombre oficial completo, demasiado largo para leerse de un
 * vistazo.
 */
const siglas = z
  .string(MENSAJE_SIGLAS)
  .trim()
  .min(2, MENSAJE_SIGLAS)
  .max(30, MENSAJE_SIGLAS)
  .transform((valor) => valor.replace(/\s+/g, " "));

/**
 * Teléfono opcional por sí solo: la obligación es tener correo o teléfono, y
 * eso se comprueba sobre la ficha entera. Mismo formato que el del perfil del
 * estudiante, y se guarda tal como se escribió porque la plataforma solo lo
 * muestra.
 */
const telefonoOpcional = z
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
 * Al menos un medio de contacto.
 *
 * No sabemos cuál usará más cada asociación, así que en lugar de imponer uno se
 * exige cualquiera de los dos: en cuanto se llena uno, el otro deja de hacer
 * falta. El error se marca en los dos campos para que el formulario resalte el
 * bloque completo y no uno elegido al azar.
 */
function exigirUnContacto(
  datos: { correo: string | null; telefono: string | null },
  contexto: z.RefinementCtx
) {
  if (datos.correo || datos.telefono) return;

  for (const campo of ["correo", "telefono"] as const) {
    contexto.addIssue({ code: "custom", path: [campo], message: MENSAJE_CONTACTO });
  }
}

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
    valor && !esImagenDelSitio(valor) && !/^[a-z][a-z0-9+.-]*:/i.test(valor)
      ? `https://${valor}`
      : valor
  )
  .refine(
    (valor) => valor === "" || esImagenDelSitio(valor) || esEnlaceSeguro(valor),
    MENSAJE_IMAGEN
  )
  .transform((valor) => (valor === "" ? null : valor))
  .nullable()
  .default(null);

export const esquemaAsociacionAdmin = z
  .object({
    nombre,
    siglas,
    descripcion: textoOpcional(5000, "La descripción no puede exceder 5000 caracteres."),
    mision: textoOpcional(2000, "La misión no puede exceder 2000 caracteres."),
    vision: textoOpcional(2000, "La visión no puede exceder 2000 caracteres."),
    correo: correoOpcional,
    telefono: telefonoOpcional,
    informacionContacto: textoOpcional(
      2000,
      "La información de contacto no puede exceder 2000 caracteres."
    ),
    imagenUrl: imagenOpcional,
  })
  .superRefine(exigirUnContacto);

export type DatosAsociacionAdmin = z.infer<typeof esquemaAsociacionAdmin>;

/** Etiqueta legible de cada campo, para nombrar el primer error en el resumen. */
export const ETIQUETAS_CAMPO_ASOCIACION: Record<string, string> = {
  nombre: "Nombre completo",
  siglas: "Siglas o nombre corto",
  descripcion: "Descripción",
  mision: "Misión",
  vision: "Visión",
  correo: "Correo",
  telefono: "Teléfono",
  informacionContacto: "Información de contacto",
  imagenUrl: "Imagen o logotipo",
};

export const esquemaClubAdmin = z
  .object({
    nombre,
    descripcion: textoOpcional(5000, "La descripción no puede exceder 5000 caracteres."),
    actividades: textoOpcional(
      2000,
      "La descripción de las actividades no puede exceder 2000 caracteres."
    ),
    correo: correoOpcional,
    telefono: telefonoOpcional,
    informacionContacto: textoOpcional(
      2000,
      "La información de contacto no puede exceder 2000 caracteres."
    ),
    imagenUrl: imagenOpcional,
  })
  .superRefine(exigirUnContacto);

export type DatosClubAdmin = z.infer<typeof esquemaClubAdmin>;

export const ETIQUETAS_CAMPO_CLUB: Record<string, string> = {
  nombre: "Nombre",
  descripcion: "Descripción",
  actividades: "Actividades",
  correo: "Correo",
  telefono: "Teléfono",
  informacionContacto: "Información de contacto",
  imagenUrl: "Imagen o logotipo",
};

export function etiquetasDeCampo(tipo: TipoOrganizacion): Record<string, string> {
  return tipo === "asociaciones" ? ETIQUETAS_CAMPO_ASOCIACION : ETIQUETAS_CAMPO_CLUB;
}

/** Entrada ya validada de una organización, discriminada por su tipo. */
export type EntradaOrganizacion =
  { tipo: "asociaciones"; datos: DatosAsociacionAdmin } | { tipo: "clubes"; datos: DatosClubAdmin };

export type LecturaOrganizacion =
  | { valida: true; entrada: EntradaOrganizacion }
  | { valida: false; errores: Record<string, string> };

/**
 * Valida el cuerpo recibido con el esquema que corresponde al tipo. Devuelve la
 * entrada discriminada para que el servicio sepa, sin suposiciones, qué ficha
 * está guardando.
 */
export function interpretarOrganizacion(
  tipo: TipoOrganizacion,
  cuerpo: unknown
): LecturaOrganizacion {
  if (tipo === "asociaciones") {
    const resultado = esquemaAsociacionAdmin.safeParse(cuerpo);
    return resultado.success
      ? { valida: true, entrada: { tipo, datos: resultado.data } }
      : { valida: false, errores: erroresPorCampo(resultado.error) };
  }

  const resultado = esquemaClubAdmin.safeParse(cuerpo);
  return resultado.success
    ? { valida: true, entrada: { tipo, datos: resultado.data } }
    : { valida: false, errores: erroresPorCampo(resultado.error) };
}

const MENSAJE_ENLACE = "Escribe un enlace que empiece con http:// o https://.";

export const esquemaIntegranteAdmin = z.object({
  nombre: z
    .string("El nombre del integrante debe tener entre 3 y 200 caracteres.")
    .trim()
    .min(3, "El nombre del integrante debe tener entre 3 y 200 caracteres.")
    .max(200, "El nombre del integrante debe tener entre 3 y 200 caracteres."),
  cargo: z
    .string("Indica el cargo del integrante.")
    .trim()
    .min(3, "Indica el cargo del integrante.")
    .max(120, "El cargo no puede exceder 120 caracteres."),
  periodo: z
    .string("Indica el periodo, por ejemplo 2026.")
    .trim()
    .min(1, "Indica el periodo, por ejemplo 2026.")
    .max(50, "El periodo no puede exceder 50 caracteres."),
  fotoUrl: imagenOpcional,
  // El orden lo decide AEUVG: la junta se lee por jerarquía de cargos y no en
  // orden alfabético.
  ordenVisualizacion: z
    .union(
      [z.literal(""), z.coerce.number().int().min(0).max(999)],
      "El orden debe ser un número entre 0 y 999."
    )
    .transform((valor) => (valor === "" ? 0 : valor))
    .default(0),
});

export type DatosIntegranteAdmin = z.infer<typeof esquemaIntegranteAdmin>;

export const esquemaRedSocialAdmin = z.object({
  plataforma: z
    .string("Indica la plataforma, por ejemplo Instagram.")
    .trim()
    .min(2, "Indica la plataforma, por ejemplo Instagram.")
    .max(50, "El nombre de la plataforma no puede exceder 50 caracteres."),
  url: z
    .string(MENSAJE_ENLACE)
    .trim()
    .max(500, "El enlace es demasiado largo.")
    .refine((valor) => esEnlaceSeguro(valor), MENSAJE_ENLACE),
});

export type DatosRedSocialAdmin = z.infer<typeof esquemaRedSocialAdmin>;
