/**
 * Normalización del texto con el que se busca en la plataforma.
 *
 * PostgreSQL puede ignorar mayúsculas con ILIKE, pero no acentos: buscar
 * "musica" no encontraría "Semana de la Música". En lugar de instalar una
 * extensión de la base solo para esto, cada registro guarda una copia de su
 * texto ya normalizada y la búsqueda compara contra ella.
 *
 * Vive fuera de los módulos de eventos y de organizaciones porque ambos
 * aplican la misma regla y la copia tiene que generarse igual en los dos.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}
