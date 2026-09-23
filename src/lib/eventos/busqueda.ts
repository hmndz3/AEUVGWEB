/**
 * Texto normalizado con el que se busca un evento.
 *
 * PostgreSQL puede ignorar mayúsculas con ILIKE, pero no acentos: buscar
 * "musica" no encontraría "Semana de la Música". En lugar de instalar una
 * extensión de la base solo para esto, el evento guarda una copia de su texto
 * ya normalizada y la búsqueda compara contra ella. La copia se recalcula cada
 * vez que se crea o edita un evento, por lo que nunca queda desfasada.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

/** Copia normalizada de los campos por los que se puede buscar un evento. */
export function textoDeBusqueda(evento: {
  nombre: string;
  descripcion: string;
  ubicacion: string;
}): string {
  return normalizarTexto(`${evento.nombre} ${evento.descripcion} ${evento.ubicacion}`);
}
