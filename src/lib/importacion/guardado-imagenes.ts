import {
  obtenerProveedorImagenes,
  type ProveedorImagenes,
} from "@/lib/imagenes/proveedor-imagenes";
import { descargarImagen, type OpcionesDescarga } from "@/lib/importacion/descarga-imagen";
import { enlaceDirectoDeImagen } from "@/lib/importacion/enlace-imagen";

/**
 * Qué pasó con la imagen de una fila.
 *
 * "conservada" es el caso de los ambientes sin almacenamiento configurado: no
 * hay dónde guardar el archivo, así que se deja el enlace tal como se escribió.
 * La fila entra igual; lo que no se puede es inventarse una imagen.
 */
export type ResultadoImagen =
  | { tipo: "guardada"; url: string }
  | { tipo: "conservada"; url: string }
  | { tipo: "fallo"; mensaje: string };

export interface GuardadoDeImagenes {
  guardar(enlace: string): Promise<ResultadoImagen>;
}

/**
 * Baja cada imagen del enlace de la hoja y la guarda en la plataforma.
 *
 * Recuerda los enlaces que ya resolvió porque una hoja repite la misma imagen
 * en varias filas —el logotipo de la asociación que organiza diez actividades—
 * y bajarla diez veces sería diez veces el mismo archivo en el almacenamiento.
 */
export class GuardadoImagenesPorEnlace implements GuardadoDeImagenes {
  private readonly resueltos = new Map<string, ResultadoImagen>();

  constructor(
    private readonly proveedor: ProveedorImagenes | null,
    private readonly opciones: OpcionesDescarga = {}
  ) {}

  async guardar(enlace: string): Promise<ResultadoImagen> {
    const clave = enlace.trim();
    const recordado = this.resueltos.get(clave);
    if (recordado) return recordado;

    const resultado = await this.resolver(clave);
    this.resueltos.set(clave, resultado);

    return resultado;
  }

  private async resolver(enlace: string): Promise<ResultadoImagen> {
    if (!this.proveedor) {
      // Sin almacenamiento el enlace se deja como está, pero traducido: el de
      // compartir de Drive devuelve una página y no se vería la imagen.
      return { tipo: "conservada", url: enlaceDirectoDeImagen(enlace) };
    }

    const descarga = await descargarImagen(enlace, this.opciones);
    if (!descarga.ok) return { tipo: "fallo", mensaje: descarga.mensaje };

    try {
      return { tipo: "guardada", url: await this.proveedor.subir(descarga.imagen) };
    } catch {
      return {
        tipo: "fallo",
        mensaje: "La imagen se descargó pero no se pudo guardar en la plataforma.",
      };
    }
  }
}

export function crearGuardadoDeImagenes(opciones: OpcionesDescarga = {}): GuardadoDeImagenes {
  return new GuardadoImagenesPorEnlace(obtenerProveedorImagenes(), opciones);
}
