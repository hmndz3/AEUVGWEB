import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases de Tailwind resolviendo los conflictos entre utilidades. */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}
