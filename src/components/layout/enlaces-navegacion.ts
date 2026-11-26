import { ROLES, tieneRol, type Rol } from "@/lib/auth/roles";

export type Enlace = {
  href: string;
  texto: string;
  /** Sin roles, el enlace es público. */
  roles?: readonly Rol[];
};

export const ENLACES: readonly Enlace[] = [
  { href: "/", texto: "Inicio" },
  { href: "/eventos", texto: "Eventos" },
  { href: "/calendario", texto: "Calendario" },
  { href: "/asociaciones", texto: "Asociaciones" },
  { href: "/clubes", texto: "Clubes" },
  { href: "/tutorias", texto: "Tutorías" },
  { href: "/prestamo-batas", texto: "Batas" },
  { href: "/sobre-aeuvg", texto: "Sobre AEUVG" },
  // El voluntario recibe su pestaña al ser aceptado, igual que el
  // administrador: el rol VOLUNTARIO se concede con la primera asignación a un
  // turno y se retira con la última, así que la pestaña aparece y desaparece
  // sola. Ver docs/prestamo-batas.md.
  { href: "/prestamo-batas/panel", texto: "Salón de batas", roles: [ROLES.voluntario] },
  { href: "/admin", texto: "Panel", roles: [ROLES.administrador] },
];

/**
 * Enlaces que le tocan a quien tiene estos roles. Mientras la sesión no se ha
 * resuelto (`roles` en nulo) solo se muestran los públicos, para que el menú no
 * parpadee mostrando opciones que luego desaparecen.
 */
export function enlacesVisibles(roles: Rol[] | null): Enlace[] {
  return ENLACES.filter(
    (enlace) => !enlace.roles || (roles !== null && tieneRol(roles, enlace.roles))
  );
}

function coincide(href: string, rutaActual: string): boolean {
  return href === "/" ? rutaActual === "/" : rutaActual.startsWith(href);
}

/**
 * Enlace que corresponde a la ruta actual. Se queda con el más específico
 * porque hay enlaces anidados —«Batas» y el «Salón de batas» del voluntario—, y
 * si no, estando en el panel se marcarían los dos.
 */
export function enlaceActivo(enlaces: readonly Enlace[], rutaActual: string): string | null {
  let activo: string | null = null;

  for (const enlace of enlaces) {
    if (
      coincide(enlace.href, rutaActual) &&
      (activo === null || enlace.href.length > activo.length)
    )
      activo = enlace.href;
  }

  return activo;
}
