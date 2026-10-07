import { normalizarTexto } from "@/lib/busqueda-texto";

export { normalizarTexto };

/**
 * Copia normalizada de los campos por los que se puede buscar un evento. Se
 * recalcula cada vez que se crea o edita uno, por lo que nunca queda desfasada.
 */
export function textoDeBusqueda(evento: {
  nombre: string;
  descripcion: string;
  ubicacion: string;
}): string {
  return normalizarTexto(`${evento.nombre} ${evento.descripcion} ${evento.ubicacion}`);
}
