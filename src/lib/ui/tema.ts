/**
 * Preferencia de tema de la persona que mira.
 *
 * Vive en el navegador y no en la cuenta: es una preferencia del aparato, no
 * del usuario. Quien entra desde la computadora de la universidad y desde su
 * teléfono puede quererla distinta en cada uno, y guardarla en la base
 * obligaría además a una migración y a resolverla en el servidor en cada
 * carga.
 */
export const TEMAS = ["sistema", "claro", "oscuro"] as const;

export type Tema = (typeof TEMAS)[number];

export const ETIQUETAS_TEMA: Record<Tema, string> = {
  sistema: "El de mi dispositivo",
  claro: "Claro",
  oscuro: "Oscuro",
};

export const DESCRIPCIONES_TEMA: Record<Tema, string> = {
  sistema: "Cambia solo cuando tu teléfono o tu computadora cambian.",
  claro: "El fondo crema de siempre.",
  oscuro: "Fondo oscuro, con los mismos colores de AEUVG.",
};

/** Clave con la que se guarda. Lleva prefijo para no chocar con nada más. */
export const CLAVE_TEMA = "aeuvg:tema";

export function esTema(valor: unknown): valor is Tema {
  return typeof valor === "string" && (TEMAS as readonly string[]).includes(valor);
}

/** El tema que toca pintar: "sistema" se resuelve contra la preferencia del aparato. */
export function resolverTema(tema: Tema, prefiereOscuro: boolean): "claro" | "oscuro" {
  if (tema === "sistema") return prefiereOscuro ? "oscuro" : "claro";

  return tema;
}

/**
 * Guion que aplica el tema antes de que el navegador pinte.
 *
 * Va en línea en el documento y no en un componente: para cuando React toma
 * el control, la página ya se pintó, y con el tema oscuro guardado se vería un
 * destello claro en cada carga. Si algo falla —modo privado, almacenamiento
 * bloqueado— no hace nada y el sitio se queda en claro, que es el de siempre.
 */
export const GUION_TEMA = `(()=>{try{var t=localStorage.getItem(${JSON.stringify(CLAVE_TEMA)})||"sistema";var o=t==="oscuro"||(t==="sistema"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.tema=o?"oscuro":"claro"}catch(e){}})()`;
