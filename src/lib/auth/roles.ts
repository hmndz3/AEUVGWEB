/** Roles del sistema. Coinciden con los nombres cargados en el catálogo `rol`. */
export const ROLES = {
  estudiante: "ESTUDIANTE",
  tutor: "TUTOR",
  administrador: "ADMINISTRADOR",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_VALIDOS: readonly Rol[] = Object.values(ROLES);

/** Normaliza el nombre almacenado en la base, que puede variar en mayúsculas. */
export function normalizarRol(nombre: string): Rol | null {
  const candidato = nombre.trim().toUpperCase();
  return ROLES_VALIDOS.find((rol) => rol === candidato) ?? null;
}

export function tieneRol(rolesUsuario: readonly Rol[], requeridos: readonly Rol[]): boolean {
  return requeridos.some((rol) => rolesUsuario.includes(rol));
}

export function esAdministrador(rolesUsuario: readonly Rol[]): boolean {
  return rolesUsuario.includes(ROLES.administrador);
}
