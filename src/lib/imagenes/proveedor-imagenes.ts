import { createHash } from "node:crypto";

export type ImagenSubida = {
  nombre: string;
  tipo: string;
  contenido: ArrayBuffer;
};

export interface ProveedorImagenes {
  subir(imagen: ImagenSubida): Promise<string>;
}

/**
 * Proveedor local para desarrollo y pruebas. No sale a la red: conserva las
 * imágenes en memoria y devuelve una dirección de datos, de modo que el flujo
 * del formulario pueda probarse completo sin contratar el servicio externo.
 */
export class ProveedorImagenesMemoria implements ProveedorImagenes {
  readonly subidas: ImagenSubida[] = [];

  async subir(imagen: ImagenSubida): Promise<string> {
    this.subidas.push(imagen);
    const base64 = Buffer.from(imagen.contenido).toString("base64");

    return `data:${imagen.tipo};base64,${base64}`;
  }
}

/**
 * Subida firmada a Cloudinary.
 *
 * El almacenamiento tiene que ser externo porque el sistema de archivos de
 * Railway es efímero: cualquier despliegue borraría las imágenes que AEUVG
 * haya subido. La firma se calcula en el servidor, así que la clave secreta
 * nunca llega al navegador.
 */
export class ProveedorImagenesCloudinary implements ProveedorImagenes {
  constructor(
    private readonly nombreNube: string,
    private readonly claveApi: string,
    private readonly secreto: string,
    private readonly carpeta: string
  ) {}

  private firmar(parametros: Record<string, string>): string {
    const texto = Object.keys(parametros)
      .sort()
      .map((clave) => `${clave}=${parametros[clave]}`)
      .join("&");

    return createHash("sha1")
      .update(texto + this.secreto)
      .digest("hex");
  }

  async subir(imagen: ImagenSubida): Promise<string> {
    const parametros = {
      folder: this.carpeta,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };

    const formulario = new FormData();
    formulario.append("file", new Blob([imagen.contenido], { type: imagen.tipo }), imagen.nombre);
    formulario.append("api_key", this.claveApi);
    formulario.append("folder", parametros.folder);
    formulario.append("timestamp", parametros.timestamp);
    formulario.append("signature", this.firmar(parametros));

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${this.nombreNube}/image/upload`,
      { method: "POST", body: formulario }
    );

    if (!respuesta.ok) {
      throw new Error("El servicio de imágenes rechazó la subida.");
    }

    const cuerpo = (await respuesta.json()) as { secure_url?: string };

    if (!cuerpo.secure_url) {
      throw new Error("El servicio de imágenes no devolvió la dirección de la imagen.");
    }

    return cuerpo.secure_url;
  }
}

let proveedorMemoria: ProveedorImagenesMemoria | undefined;

/**
 * Devuelve el proveedor configurado, o null cuando no hay ninguno.
 *
 * Sin proveedor la plataforma sigue funcionando: el formulario de eventos
 * acepta la dirección de una imagen externa, y solo se deshabilita la subida
 * de archivos. Esto permite publicar el módulo antes de que AEUVG contrate el
 * servicio.
 */
export function obtenerProveedorImagenes(): ProveedorImagenes | null {
  const proveedor = process.env.IMAGE_PROVIDER?.trim().toLocaleLowerCase("en-US");

  if (!proveedor || proveedor === "ninguno") return null;

  if (proveedor === "memoria") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("IMAGE_PROVIDER=memoria no está permitido en producción.");
    }

    proveedorMemoria ??= new ProveedorImagenesMemoria();
    return proveedorMemoria;
  }

  if (proveedor === "cloudinary") {
    const nombreNube = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const claveApi = process.env.CLOUDINARY_API_KEY?.trim();
    const secreto = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!nombreNube || !claveApi || !secreto) {
      throw new Error(
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET son obligatorias para usar Cloudinary."
      );
    }

    return new ProveedorImagenesCloudinary(
      nombreNube,
      claveApi,
      secreto,
      process.env.CLOUDINARY_FOLDER?.trim() || "aeuvg/eventos"
    );
  }

  throw new Error("IMAGE_PROVIDER debe ser 'ninguno', 'memoria' o 'cloudinary'.");
}
