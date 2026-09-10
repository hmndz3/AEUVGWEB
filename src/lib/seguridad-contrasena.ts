export type SeguridadContrasena = {
  puntaje: 0 | 1 | 2 | 3 | 4;
  nivel: "Sin evaluar" | "Baja" | "Media" | "Alta";
  mensaje: string;
};

export function evaluarSeguridadContrasena(contrasena: string): SeguridadContrasena {
  if (!contrasena) {
    return { puntaje: 0, nivel: "Sin evaluar", mensaje: "Escribe una contraseña para evaluarla." };
  }

  const puntaje = [
    contrasena.length >= 8,
    /[a-záéíóúñ]/u.test(contrasena) && /[A-ZÁÉÍÓÚÑ]/u.test(contrasena),
    /\d/u.test(contrasena),
    /[^\p{L}\p{N}\s]/u.test(contrasena),
  ].filter(Boolean).length as SeguridadContrasena["puntaje"];

  if (puntaje <= 1) {
    return {
      puntaje,
      nivel: "Baja",
      mensaje: "Usa al menos 8 caracteres y combina distintos tipos.",
    };
  }

  if (puntaje <= 3) {
    return {
      puntaje,
      nivel: "Media",
      mensaje: "Agrega los requisitos que aún falten para reforzarla.",
    };
  }

  return {
    puntaje,
    nivel: "Alta",
    mensaje: "Cumple los requisitos de seguridad de la cuenta.",
  };
}
