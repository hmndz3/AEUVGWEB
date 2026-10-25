import {
  COLUMNAS_EXPORTACION,
  valoresDeFila,
  type FilaExportacion,
} from "@/lib/horas-beca/exportacion";

/**
 * Marca de orden de bytes.
 *
 * Excel abre un CSV suponiendo la codificación del sistema, que en Windows no es
 * UTF-8: sin esta marca al inicio, "Matemática" se lee "MatemÃ¡tica". Tres bytes
 * al principio del archivo bastan para que lo abra bien, y el resto de los
 * programas la ignoran.
 */
const MARCA_UTF8 = "﻿";

/** Separador de columnas. El punto y coma es el que espera Excel en español. */
const SEPARADOR = ";";

/**
 * Escapa un valor para el CSV.
 *
 * Un campo que contenga el separador, comillas o un salto de línea rompería las
 * columnas si se escribiera tal cual. La convención del formato es encerrarlo
 * entre comillas y duplicar las que lleve dentro.
 */
export function escaparCampoCsv(valor: string | number): string {
  const texto = String(valor);

  if (!/[";\n\r]/.test(texto)) return texto;

  return `"${texto.replaceAll('"', '""')}"`;
}

/**
 * Registros de horas beca en CSV.
 *
 * Se arma como texto y no con una librería porque el formato son dos reglas
 * —separar con un carácter y escapar lo que lo contenga— y una dependencia más
 * para eso no se justifica.
 */
export function generarCsv(filas: FilaExportacion[]): string {
  const lineas = [
    COLUMNAS_EXPORTACION.map(escaparCampoCsv).join(SEPARADOR),
    ...filas.map((fila) => valoresDeFila(fila).map(escaparCampoCsv).join(SEPARADOR)),
  ];

  // Fin de línea de Windows: es el que esperan Excel y el Bloc de notas.
  return MARCA_UTF8 + lineas.join("\r\n") + "\r\n";
}
