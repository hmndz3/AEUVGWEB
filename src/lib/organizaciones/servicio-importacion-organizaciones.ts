import type { GuardadoDeImagenes } from "@/lib/importacion/guardado-imagenes";
import { enParalelo } from "@/lib/importacion/paralelo";
import type {
  AvisoFila,
  ErrorFilaImportacion,
  ResultadoImportacionArchivo,
  ResultadoRevisionArchivo,
} from "@/lib/importacion/reporte";
import {
  leerFilasDeOrganizaciones,
  type FilaCrudaOrganizacion,
} from "@/lib/organizaciones/importacion-organizaciones";
import type { RepositorioImportacionOrganizaciones } from "@/lib/organizaciones/repositorio-importacion-organizaciones";
import type { ResultadoOrganizacion } from "@/lib/organizaciones/servicio-organizaciones";
import {
  validarFilasDeOrganizaciones,
  type FilaValidaOrganizacion,
  type ValidacionOrganizaciones,
} from "@/lib/organizaciones/validacion-importacion-organizaciones";
import {
  ETIQUETA_TIPO,
  type DatosRedSocialAdmin,
  type EntradaOrganizacion,
  type TipoOrganizacion,
} from "@/validators/organizacion-admin";

/** Descargas de imágenes a la vez; mismo criterio que en los eventos. */
const DESCARGAS_SIMULTANEAS = 4;

/**
 * Lo que la importación necesita para crear fichas.
 *
 * Es el servicio de organizaciones del panel, visto por la rendija de las dos
 * operaciones que hacen falta. Se declara así, y no como la clase entera, para
 * que la importación pueda probarse sin levantar el repositorio completo.
 */
export interface CreadorDeOrganizaciones {
  crear(entrada: EntradaOrganizacion): Promise<ResultadoOrganizacion>;
  agregarRedSocial(
    tipo: TipoOrganizacion,
    id: number,
    datos: DatosRedSocialAdmin
  ): Promise<ResultadoOrganizacion>;
}

/**
 * Importación de asociaciones y de clubes desde un archivo de Excel.
 *
 * Cada grupo llena su fila de la plantilla y AEUVG carga el archivo una sola
 * vez, en lugar de abrir el formulario del panel una vez por grupo. Las fichas
 * se crean por el mismo servicio que usa el panel, así que las reglas —nombre
 * libre, siglas libres, un medio de contacto— son exactamente las mismas.
 */
export class ServicioImportacionOrganizaciones {
  constructor(
    private readonly repositorio: RepositorioImportacionOrganizaciones,
    private readonly organizaciones: CreadorDeOrganizaciones,
    private readonly imagenes: GuardadoDeImagenes
  ) {}

  /** Lee y valida sin escribir nada. */
  async revisar(archivo: Buffer, tipo: TipoOrganizacion): Promise<ResultadoRevisionArchivo> {
    const lectura = await leerFilasDeOrganizaciones(archivo, tipo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = await this.validar(lectura.filas, tipo);

    return {
      tipo: "revisado",
      total: validacion.total,
      correctas: validacion.validas.length,
      fallidas: validacion.errores.length,
      errores: validacion.errores,
      repetidas: validacion.repetidas,
      avisos: [],
    };
  }

  /**
   * Crea las fichas nuevas del archivo, con su logotipo y sus redes.
   *
   * Cada ficha va por separado: una fila que falle no debe impedir que entren
   * las demás, que es justo lo que AEUVG pierde cuando carga todo a mano.
   */
  async importar(archivo: Buffer, tipo: TipoOrganizacion): Promise<ResultadoImportacionArchivo> {
    const lectura = await leerFilasDeOrganizaciones(archivo, tipo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = await this.validar(lectura.filas, tipo);
    const errores = [...validacion.errores];
    const avisos: AvisoFila[] = [];

    if (validacion.validas.length === 0) {
      return {
        tipo: "sin_filas_nuevas",
        total: validacion.total,
        correctas: 0,
        fallidas: errores.length,
        errores,
        repetidas: validacion.repetidas,
        avisos,
      };
    }

    const imagenes = await this.resolverImagenes(validacion.validas, avisos);
    let guardadas = 0;

    for (const valida of validacion.validas) {
      const entrada = conImagen(valida.entrada, imagenes.get(valida.fila) ?? null);
      const resultado = await this.organizaciones.crear(entrada).catch(() => null);

      if (!resultado || resultado.tipo !== "guardada") {
        errores.push(problemaAlGuardar(valida, tipo, resultado));
        continue;
      }

      guardadas += 1;
      await this.guardarRedes(tipo, resultado.id, valida, avisos);
    }

    return {
      tipo: "importado",
      guardadas,
      total: validacion.total,
      correctas: guardadas,
      fallidas: errores.length,
      errores,
      repetidas: validacion.repetidas,
      avisos,
    };
  }

  private async validar(
    filas: FilaCrudaOrganizacion[],
    tipo: TipoOrganizacion
  ): Promise<ValidacionOrganizaciones> {
    const registrados = await this.repositorio.registrados(tipo);

    return validarFilasDeOrganizaciones(filas, tipo, registrados);
  }

  /**
   * Las redes se agregan después de crear la ficha, una por una.
   *
   * Que una falle no invalida la ficha: queda creada y la red se reporta como
   * aviso, porque agregarla a mano es un clic y volver a cargar el archivo
   * entero por un enlace repetido no tendría sentido.
   */
  private async guardarRedes(
    tipo: TipoOrganizacion,
    id: number,
    valida: FilaValidaOrganizacion,
    avisos: AvisoFila[]
  ): Promise<void> {
    for (const red of valida.redes) {
      const resultado = await this.organizaciones.agregarRedSocial(tipo, id, red).catch(() => null);

      if (!resultado || resultado.tipo !== "guardada") {
        avisos.push({
          fila: valida.fila,
          referencia: valida.entrada.datos.nombre,
          mensaje: `No se agregó el enlace de ${red.plataforma}; puedes ponerlo desde la ficha.`,
        });
      }
    }
  }

  private async resolverImagenes(
    validas: FilaValidaOrganizacion[],
    avisos: AvisoFila[]
  ): Promise<Map<number, string | null>> {
    const conEnlace = validas.filter((valida) => valida.enlaceImagen !== "");
    const resueltas = new Map<number, string | null>();

    const resultados = await enParalelo(conEnlace, DESCARGAS_SIMULTANEAS, (valida) =>
      this.imagenes.guardar(valida.enlaceImagen)
    );

    conEnlace.forEach((valida, indice) => {
      const resultado = resultados[indice];

      if (resultado.tipo === "fallo") {
        resueltas.set(valida.fila, null);
        avisos.push({
          fila: valida.fila,
          referencia: valida.entrada.datos.nombre,
          mensaje: `La ficha se creó sin imagen. ${resultado.mensaje}`,
        });
        return;
      }

      resueltas.set(valida.fila, resultado.url);

      if (resultado.tipo === "conservada") {
        avisos.push({
          fila: valida.fila,
          referencia: valida.entrada.datos.nombre,
          mensaje:
            "La imagen no se descargó porque este ambiente no tiene almacenamiento configurado: se guardó el enlace tal cual.",
        });
      }
    });

    return resueltas;
  }
}

/** Reemplaza el enlace de la hoja por la dirección ya guardada. */
function conImagen(entrada: EntradaOrganizacion, imagenUrl: string | null): EntradaOrganizacion {
  return entrada.tipo === "asociaciones"
    ? { tipo: "asociaciones", datos: { ...entrada.datos, imagenUrl } }
    : { tipo: "clubes", datos: { ...entrada.datos, imagenUrl } };
}

function problemaAlGuardar(
  valida: FilaValidaOrganizacion,
  tipo: TipoOrganizacion,
  resultado: ResultadoOrganizacion | null
): ErrorFilaImportacion {
  const mensaje =
    resultado?.tipo === "invalida"
      ? Object.values(resultado.errores)[0]
      : `No se pudo guardar la ${ETIQUETA_TIPO[tipo].singular}. Revisa la fila e inténtalo de nuevo.`;

  return {
    fila: valida.fila,
    referencia: valida.entrada.datos.nombre,
    campo: ETIQUETA_TIPO[tipo].singular === "club" ? "Club" : "Asociación",
    mensaje,
  };
}
