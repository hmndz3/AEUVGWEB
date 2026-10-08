import { normalizarTexto } from "@/lib/busqueda-texto";

/**
 * Copia normalizada de los campos por los que se busca una asociación.
 *
 * Se incluyen las siglas porque es como el estudiantado busca a una asociación
 * ("AECCTIUVG"), y la misión además de la descripción porque muchas
 * asociaciones explican ahí a qué se dedican: buscar "voluntariado" debe
 * encontrarlas aunque la palabra no esté en su descripción.
 */
export function textoDeBusquedaAsociacion(asociacion: {
  nombre: string;
  siglas: string | null;
  descripcion: string | null;
  mision: string | null;
}): string {
  return normalizarTexto(
    [
      asociacion.nombre,
      asociacion.siglas ?? "",
      asociacion.descripcion ?? "",
      asociacion.mision ?? "",
    ].join(" ")
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
