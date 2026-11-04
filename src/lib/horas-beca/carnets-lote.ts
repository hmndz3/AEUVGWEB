import { normalizarCarnet } from "@/lib/horas-beca/busqueda-horas";
import { MAXIMO_REGISTROS_EN_LOTE } from "@/lib/horas-beca/servicio-horas-beca";

/**
 * Carnets que admite un registro en lote. Es el mismo límite de la acreditación
 * en lote: la cantidad de gente que cabe en una actividad, con holgura.
 */
export const MAXIMO_CARNETS_LOTE = MAXIMO_REGISTROS_EN_LOTE;

/** Lo que admite un carnet: letras, números y guiones, de 3 a 20 caracteres. */
const CARNET_VALIDO = /^[A-Z0-9-]{3,20}$/;

export type CarnetsSeparados = {
  /** Carnets normalizados, sin repetidos y en el orden en que se escribieron. */
  carnets: string[];
  /** Lo que se escribió y no puede ser un carnet, tal cual, para señalarlo. */
  invalidos: string[];
  /** Carnets que venían más de una vez; se conserva el primero. */
  repetidos: string[];
};

/**
 * Separa el texto pegado en la lista de carnets.
 *
 * Acepta cualquier mezcla de comas, punto y coma, espacios y saltos de línea,
 * porque los carnets llegan pegados de sitios distintos: una columna de Excel
 * los trae uno por línea y un mensaje los trae separados por comas. Exigir un
 * separador concreto obligaría a reescribir a mano justo lo que esta pantalla
 * viene a evitar.
 *
 * Los repetidos se descartan en lugar de rechazarse: pegar dos veces el mismo
 * carnet de una lista larga es un descuido corriente, y registrarle las horas
 * dos veces al mismo estudiante sería peor que ignorarlo.
 */
export function separarCarnets(texto: string): CarnetsSeparados {
  const piezas = texto
    .split(/[\s,;]+/)
    .map((pieza) => pieza.trim())
    .filter((pieza) => pieza.length > 0);

  const carnets: string[] = [];
  const invalidos: string[] = [];
  const repetidos: string[] = [];
  const vistos = new Set<string>();

  for (const pieza of piezas) {
    const carnet = normalizarCarnet(pieza);

    if (!CARNET_VALIDO.test(carnet)) {
      if (!invalidos.includes(pieza)) invalidos.push(pieza);
      continue;
    }
    if (vistos.has(carnet)) {
      if (!repetidos.includes(carnet)) repetidos.push(carnet);
      continue;
    }

    vistos.add(carnet);
    carnets.push(carnet);
  }

  return { carnets, invalidos, repetidos };
}
