/** Formatos que acepta la plataforma para las imágenes de los eventos. */
export const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;

/** Extensión con la que se guarda cada formato admitido. */
export const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Dirección que devuelve el almacenamiento en disco al subir una imagen: una
 * ruta del propio sitio, sin dominio, servida por /api/imagenes/[archivo].
 */
export const RUTA_IMAGEN_PROPIA = /^\/api\/imagenes\/[0-9a-f]{32}\.(jpg|png|webp)$/;

const MB_PREDETERMINADO = 3;
const MB_MINIMO = 1;
const MB_MAXIMO = 10;

/**
 * Tamaño máximo por imagen. Se limita por arriba a propósito: la plataforma
 * corre en el plan más pequeño de Railway y una subida grande ocuparía memoria
 * del mismo proceso que atiende al resto del sitio.
 */
export function tamanoMaximoBytes(): number {
  const configurado = Number(process.env.IMAGE_MAX_MB);
  const megas = Number.isFinite(configurado)
    ? Math.min(MB_MAXIMO, Math.max(MB_MINIMO, Math.trunc(configurado)))
    : MB_PREDETERMINADO;

  return megas * 1024 * 1024;
}

export type ResultadoValidacion = { valida: true } | { valida: false; mensaje: string };

export function validarImagen(
  imagen: { tipo: string; tamano: number },
  maximo = tamanoMaximoBytes()
): ResultadoValidacion {
  if (imagen.tamano <= 0) {
    return { valida: false, mensaje: "El archivo está vacío." };
  }

  if (!TIPOS_PERMITIDOS.includes(imagen.tipo as (typeof TIPOS_PERMITIDOS)[number])) {
    return { valida: false, mensaje: "La imagen debe estar en formato JPEG, PNG o WebP." };
  }

  if (imagen.tamano > maximo) {
    const megas = Math.round(maximo / (1024 * 1024));
    return { valida: false, mensaje: `La imagen no puede pesar más de ${megas} MB.` };
  }

  return { valida: true };
}
