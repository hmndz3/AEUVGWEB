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

/**
 * Ilustraciones del contenido de demostración (prisma/seed-demo.ts): archivos
 * estáticos versionados en public/demo, servidos por el propio sitio.
 */
export const RUTA_IMAGEN_DEMOSTRACION = /^\/demo\/(eventos|asociaciones)\/[a-z0-9-]+\.svg$/;

/**
 * Retratos de la Junta Directiva de AEUVG versionados en public/integrantes
 * (prisma/cargar-informacion-aeuvg.ts). Solo los admite la ficha de las
 * organizaciones: son fotografías institucionales, no algo que un estudiante
 * deba poder usar como su foto de perfil.
 */
export const RUTA_RETRATO_INSTITUCIONAL = /^\/integrantes\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/;

/**
 * Indica si el valor es una imagen servida por el propio sitio, sin dominio.
 * Esas rutas se guardan tal cual: completarlas con https:// las rompería.
 */
export function esImagenDelSitio(valor: string): boolean {
  return RUTA_IMAGEN_PROPIA.test(valor) || RUTA_IMAGEN_DEMOSTRACION.test(valor);
}

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

/**
 * Firmas de archivo de los formatos que acepta la plataforma.
 *
 * Los primeros bytes de un archivo dicen qué es de verdad. El encabezado que
 * manda quien sube, en cambio, es solo una afirmación suya.
 */
const FIRMAS: { tipo: string; prueba: (datos: Buffer) => boolean }[] = [
  { tipo: "image/jpeg", prueba: (d) => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff },
  {
    tipo: "image/png",
    prueba: (d) => d.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    tipo: "image/webp",
    prueba: (d) =>
      d.subarray(0, 4).toString("latin1") === "RIFF" &&
      d.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

/**
 * Formato real de un archivo, leído de su contenido.
 *
 * Devuelve null cuando no es ninguno de los formatos admitidos, incluido el
 * caso de un archivo demasiado corto para tener firma.
 */
export function tipoPorContenido(datos: Buffer): string | null {
  if (datos.length < 12) return null;

  return FIRMAS.find((firma) => firma.prueba(datos))?.tipo ?? null;
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

/**
 * Comprueba el contenido de una imagen que alguien subió.
 *
 * El tipo declarado no basta: nada impide mandar un archivo cualquiera con el
 * encabezado de una imagen, y ese archivo acabaría guardado y servido por el
 * propio dominio. Esto es A08 del OWASP Top 10 —confiar en datos que vienen de
 * fuera sin comprobarlos— y se resuelve mirando los primeros bytes.
 *
 * Devuelve el tipo real para que el almacenamiento guarde la extensión que de
 * verdad corresponde, en lugar de la que venía escrita.
 */
export function validarContenidoImagen(
  contenido: Buffer
): { valida: true; tipo: string } | { valida: false; mensaje: string } {
  const tipo = tipoPorContenido(contenido);

  if (!tipo || !TIPOS_PERMITIDOS.includes(tipo as (typeof TIPOS_PERMITIDOS)[number])) {
    return {
      valida: false,
      mensaje: "El archivo no es una imagen JPEG, PNG o WebP.",
    };
  }

  return { valida: true, tipo };
}
