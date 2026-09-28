import { normalizarTexto } from "@/lib/busqueda-texto";

/**
 * Copia normalizada de los campos por los que se busca una asociación.
 *
 * Se incluye la misión además de la descripción porque muchas asociaciones
 * explican ahí a qué se dedican, y buscar "voluntariado" debe encontrarlas
 * aunque la palabra no esté en su descripción.
 */
export function textoDeBusquedaAsociacion(asociacion: {
  nombre: string;
  descripcion: string | null;
  mision: string | null;
}): string {
  return normalizarTexto(
    [asociacion.nombre, asociacion.descripcion ?? "", asociacion.mision ?? ""].join(" ")
  );
}

/** Copia normalizada de los campos por los que se busca un club. */
export function textoDeBusquedaClub(club: {
  nombre: string;
  descripcion: string | null;
  actividades: string | null;
}): string {
  return normalizarTexto([club.nombre, club.descripcion ?? "", club.actividades ?? ""].join(" "));
}
