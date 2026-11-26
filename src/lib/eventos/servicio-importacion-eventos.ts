import { leerFilasDeEventos, type FilaCrudaEvento } from "@/lib/eventos/importacion-eventos";
import type { RepositorioImportacionEventos } from "@/lib/eventos/repositorio-importacion-eventos";
import { aDatosPersistidos, construirOrganizadores } from "@/lib/eventos/servicio-eventos";
import {
  validarFilasDeEventos,
  type FilaValidaEvento,
  type ValidacionEventos,
} from "@/lib/eventos/validacion-importacion-eventos";
import type { GuardadoDeImagenes } from "@/lib/importacion/guardado-imagenes";
import { enParalelo } from "@/lib/importacion/paralelo";
import type {
  AvisoFila,
  ErrorFilaImportacion,
  ResultadoImportacionArchivo,
  ResultadoRevisionArchivo,
} from "@/lib/importacion/reporte";

/**
 * Descargas de imágenes a la vez.
 *
 * Cuatro es un punto medio deliberado: de una en una, una hoja de cincuenta
 * afiches agotaría la petición del navegador; todas de golpe le comerían la
 * memoria al proceso, que corre en el plan más pequeño de Railway.
 */
const DESCARGAS_SIMULTANEAS = 4;

/**
 * Importación de eventos desde un archivo de Excel.
 *
 * Existe porque crear los eventos uno por uno en el panel no escala: cada
 * organizador llena la plantilla con sus actividades y AEUVG carga el archivo
 * una sola vez. Las reglas son las mismas que las del formulario —el esquema de
 * validación es el mismo objeto— más las dos que pidió AEUVG: un evento que ya
 * terminó no se publica, y uno que ya existe no se duplica.
 *
 * El trabajo está partido en dos operaciones, igual que en horas beca. La
 * revisión lee y valida sin tocar la base ni la red, para que AEUVG vea qué
 * filas tienen problemas antes de que pase nada. La importación repite la
 * lectura, descarga las imágenes y guarda solo lo que corresponde.
 */
export class ServicioImportacionEventos {
  constructor(
    private readonly repositorio: RepositorioImportacionEventos,
    private readonly imagenes: GuardadoDeImagenes
  ) {}

  /** Lee y valida sin escribir nada. */
  async revisar(archivo: Buffer, ahora = new Date()): Promise<ResultadoRevisionArchivo> {
    const lectura = await leerFilasDeEventos(archivo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = await this.validar(lectura.filas, ahora);

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
   * Crea los eventos nuevos del archivo.
   *
   * Cada evento se guarda por separado y no todos en una transacción: lo que
   * AEUVG necesita es que entre lo que se puede: una fila que falle no debe
   * tumbar las otras cuarenta que estaban bien. Los eventos nacen en borrador,
   * como los del formulario, así que nada llega a la cartelera sin que alguien
   * lo publique.
   */
  async importar(
    archivo: Buffer,
    creadoPor: number,
    ahora = new Date()
  ): Promise<ResultadoImportacionArchivo> {
    const lectura = await leerFilasDeEventos(archivo);
    if (lectura.tipo !== "leido") return lectura;

    const validacion = await this.validar(lectura.filas, ahora);
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
      const datos = { ...valida.datos, imagenUrl: imagenes.get(valida.fila) ?? null };

      try {
        await this.repositorio.crear(
          aDatosPersistidos(datos),
          construirOrganizadores(datos),
          creadoPor
        );
        guardadas += 1;
      } catch {
        errores.push(problemaAlGuardar(valida));
      }
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

  private async validar(filas: FilaCrudaEvento[], ahora: Date): Promise<ValidacionEventos> {
    const [catalogos, existentes] = await Promise.all([
      this.repositorio.catalogos(),
      this.repositorio.clavesExistentes(),
    ]);

    return validarFilasDeEventos(filas, catalogos, { ahora, existentes });
  }

  /**
   * Descarga y guarda la imagen de cada fila que trae enlace.
   *
   * Un enlace que no se puede bajar no tumba la fila: el evento se crea sin
   * imagen y se reporta como aviso, porque la foto puede agregarse después
   * desde el panel y lo demás del evento está bien.
   */
  private async resolverImagenes(
    validas: FilaValidaEvento[],
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
          referencia: valida.datos.nombre,
          mensaje: `El evento se creó sin imagen. ${resultado.mensaje}`,
        });
        return;
      }

      resueltas.set(valida.fila, resultado.url);

      if (resultado.tipo === "conservada") {
        avisos.push({
          fila: valida.fila,
          referencia: valida.datos.nombre,
          mensaje:
            "La imagen no se descargó porque este ambiente no tiene almacenamiento configurado: se guardó el enlace tal cual.",
        });
      }
    });

    return resueltas;
  }
}

function problemaAlGuardar(valida: FilaValidaEvento): ErrorFilaImportacion {
  return {
    fila: valida.fila,
    referencia: valida.datos.nombre,
    campo: "Evento",
    mensaje: "No se pudo guardar el evento. Revisa la fila e inténtalo de nuevo.",
  };
}
