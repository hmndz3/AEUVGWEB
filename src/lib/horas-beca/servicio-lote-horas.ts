import { MAXIMO_CARNETS_LOTE, separarCarnets } from "@/lib/horas-beca/carnets-lote";
import type { RepositorioImportacion } from "@/lib/horas-beca/repositorio-importacion";
import type { DatosRegistroHora } from "@/lib/horas-beca/servicio-horas-beca";

/** Un carnet del lote, ya resuelto contra las cuentas de la plataforma. */
export type CarnetRevisado = {
  carnet: string;
  /** Nombre de la cuenta, o null si ese carnet todavía no tiene una. */
  nombreEstudiante: string | null;
};

export type ResultadoRevisionLote = {
  encontrados: CarnetRevisado[];
  /** Carnets sin cuenta: no se les puede poner nombre desde aquí. */
  sinCuenta: string[];
  invalidos: string[];
  repetidos: string[];
};

export type ResultadoLote =
  | { tipo: "registrado"; creados: number; carnets: string[] }
  | { tipo: "invalido"; mensaje: string };

/** Datos de la actividad, iguales para todos los carnets del lote. */
export type DatosActividadLote = Omit<DatosRegistroHora, "carnet" | "nombreEstudiante">;

/**
 * Registro de las mismas horas para varias personas a la vez.
 *
 * Una actividad de apoyo la realizan veinte estudiantes el mismo día, en el
 * mismo horario y en lo mismo; capturar veinte veces los mismos cinco campos es
 * donde aparecen los errores de dedo, y es trabajo que la hoja de cálculo ya
 * imponía. Aquí se escribe la actividad una vez y la lista de carnets una vez.
 *
 * El nombre no se pide: lo pone la cuenta de cada carnet, que es el verificado
 * contra el correo institucional. Por eso el lote solo admite carnets que ya
 * tienen cuenta; los que no la tienen se señalan en la revisión, y sus horas se
 * cargan por el importador o una por una, que son los caminos donde el nombre
 * se escribe explícitamente.
 */
export class ServicioLoteHoras {
  constructor(private readonly repositorio: RepositorioImportacion) {}

  /** Resuelve la lista pegada contra las cuentas, sin escribir nada. */
  async revisar(texto: string): Promise<ResultadoRevisionLote> {
    const { carnets, invalidos, repetidos } = separarCarnets(texto);
    const cuentas = await this.repositorio.estudiantesPorCarnet(carnets);

    const encontrados: CarnetRevisado[] = [];
    const sinCuenta: string[] = [];

    for (const carnet of carnets) {
      const cuenta = cuentas.get(carnet);
      if (cuenta) encontrados.push({ carnet, nombreEstudiante: cuenta.nombreCompleto });
      else sinCuenta.push(carnet);
    }

    return { encontrados, sinCuenta, invalidos, repetidos };
  }

  /**
   * Registra la actividad para todos los carnets con cuenta.
   *
   * Se escribe en una sola operación: veinte registros de la misma actividad
   * son un solo hecho, y guardarlos uno por uno dejaría la mitad adentro si
   * algo falla a medio camino.
   */
  async registrar(
    texto: string,
    datos: DatosActividadLote,
    creadoPor: number
  ): Promise<ResultadoLote> {
    const revision = await this.revisar(texto);

    if (revision.invalidos.length > 0) {
      return {
        tipo: "invalido",
        mensaje: `Estos valores no pueden ser un carnet: ${revision.invalidos.join(", ")}.`,
      };
    }
    if (revision.sinCuenta.length > 0) {
      return {
        tipo: "invalido",
        mensaje: `Estos carnets todavía no tienen cuenta en la plataforma: ${revision.sinCuenta.join(", ")}. Regístrales las horas una por una o cárgalas desde Excel, donde sí se escribe el nombre.`,
      };
    }
    if (revision.encontrados.length === 0) {
      return { tipo: "invalido", mensaje: "Escribe al menos un carnet." };
    }
    if (revision.encontrados.length > MAXIMO_CARNETS_LOTE) {
      return {
        tipo: "invalido",
        mensaje: `No se pueden registrar más de ${MAXIMO_CARNETS_LOTE} carnets a la vez.`,
      };
    }

    const cuentas = await this.repositorio.estudiantesPorCarnet(
      revision.encontrados.map(({ carnet }) => carnet)
    );

    const creados = await this.repositorio.crearRegistrosImportados(
      revision.encontrados.map(({ carnet, nombreEstudiante }) => ({
        ...datos,
        carnet,
        nombreEstudiante: nombreEstudiante ?? carnet,
        idEstudiante: cuentas.get(carnet)?.idEstudiante ?? null,
      })),
      null,
      creadoPor
    );

    return { tipo: "registrado", creados, carnets: revision.encontrados.map((c) => c.carnet) };
  }
}
