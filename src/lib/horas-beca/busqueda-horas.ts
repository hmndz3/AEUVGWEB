import { normalizarTexto } from "@/lib/busqueda-texto";

export { normalizarTexto };

/**
 * Carnet en la única forma en la que se guarda y se compara.
 *
 * El carnet es lo que une un registro de horas con la cuenta de su dueño, y
 * llega escrito de dos fuentes distintas: la hoja de cálculo de AEUVG y el
 * formulario de registro de la plataforma. Un espacio sobrante o una letra en
 * minúscula dejarían el registro fuera del perfil al que pertenece, así que la
 * comparación nunca se hace sobre el texto crudo.
 */
export function normalizarCarnet(carnet: string): string {
  return carnet.replace(/\s+/g, "").toUpperCase();
}

/**
 * Copia normalizada de los campos por los que se busca un registro de horas.
 *
 * Reúne el carnet, el nombre del estudiante y la descripción de la actividad: el
 * panel tiene que encontrar un registro tanto por quién realizó las horas como
 * por en qué apoyó. Se recalcula en cada guardado, igual que la de eventos y la
 * de organizaciones, por lo que no puede quedar desfasada.
 */
export function textoDeBusquedaRegistroHora(registro: {
  carnet: string;
  nombreEstudiante: string;
  descripcionActividad: string;
}): string {
  return normalizarTexto(
    `${registro.carnet} ${registro.nombreEstudiante} ${registro.descripcionActividad}`
  );
}
