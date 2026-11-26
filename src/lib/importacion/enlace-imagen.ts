/**
 * Enlaces de imagen pegados en una hoja de Excel.
 *
 * Quien llena la plantilla no tiene un servidor donde publicar la foto del
 * evento: la sube a su Drive o a su OneDrive y pega el enlace para compartir.
 * Ese enlace no es la imagen, es la página del visor: pedirlo devuelve HTML y
 * la foto nunca aparecería. Aquí se traduce cada forma conocida de compartir a
 * la dirección que entrega el archivo, que es la que el importador descarga.
 *
 * Lo que no se reconoce se devuelve intacto: un enlace que ya apunta a un
 * archivo (…/foto.jpg) funciona tal cual.
 */

/** Identificador del archivo en un enlace de Google Drive, si lo trae. */
function idDeDrive(url: URL): string | null {
  const porRuta = url.pathname.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{10,})/);
  if (porRuta) return porRuta[1];

  const porParametro = url.searchParams.get("id");
  if (porParametro && /^[a-zA-Z0-9_-]{10,}$/.test(porParametro)) return porParametro;

  return null;
}

/**
 * Enlace de OneDrive personal a la dirección pública que entrega el contenido.
 *
 * Es el camino que documenta Microsoft para los enlaces de compartir: el propio
 * enlace, codificado en base64url, identifica el recurso compartido. Vale tanto
 * para los enlaces cortos 1drv.ms como para los de onedrive.live.com, y no
 * necesita credenciales mientras el archivo esté compartido por enlace.
 */
function contenidoDeOneDrive(enlace: string): string {
  const codificado = Buffer.from(enlace, "utf8")
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\//g, "_")
    .replace(/\+/g, "-");

  return `https://api.onedrive.com/v1.0/shares/u!${codificado}/root/content`;
}

/** Agrega o reemplaza un parámetro de la consulta. */
function conParametro(url: URL, clave: string, valor: string): string {
  url.searchParams.set(clave, valor);
  return url.toString();
}

/**
 * Dirección que entrega el archivo, a partir del enlace que se pegó.
 *
 * Devuelve el enlace sin cambios cuando no corresponde a ningún servicio
 * conocido: puede ser un enlace directo, y en ese caso ya sirve.
 */
export function enlaceDirectoDeImagen(enlace: string): string {
  let url: URL;

  try {
    url = new URL(enlace);
  } catch {
    return enlace;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return enlace;

  const anfitrion = url.hostname.toLocaleLowerCase("en-US");

  if (anfitrion === "drive.google.com" || anfitrion === "docs.google.com") {
    const id = idDeDrive(url);
    if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download`;
    return enlace;
  }

  // Ya es la dirección de descarga de Drive: solo se asegura el parámetro.
  if (anfitrion === "drive.usercontent.google.com") {
    return conParametro(url, "export", "download");
  }

  if (anfitrion === "1drv.ms" || anfitrion === "onedrive.live.com") {
    return contenidoDeOneDrive(enlace);
  }

  // OneDrive de empresa o de la universidad: el propio enlace entrega el
  // archivo cuando se le pide la descarga.
  if (anfitrion.endsWith(".sharepoint.com")) {
    return conParametro(url, "download", "1");
  }

  if (anfitrion === "www.dropbox.com" || anfitrion === "dropbox.com") {
    url.searchParams.delete("dl");
    return conParametro(url, "raw", "1");
  }

  return enlace;
}

/** Indica si el enlace apunta a un servicio para el que hace falta traducirlo. */
export function esEnlaceParaCompartir(enlace: string): boolean {
  return enlaceDirectoDeImagen(enlace) !== enlace;
}
