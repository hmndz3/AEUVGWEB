import type { z } from "zod";

/**
 * Traduce los errores de Zod a un mapa campo/mensaje para los formularios.
 *
 * Vive aparte de cada esquema porque todos los formularios del panel presentan
 * sus errores igual: junto al campo y con un resumen arriba del formulario.
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};

  for (const problema of error.issues) {
    const campo = problema.path.join(".") || "general";
    errores[campo] ??= problema.message;
  }

  return errores;
}
