export type ConfiguracionSesion = {
  secreto: string;
  duracionSegundos: number;
};

function leerVariable(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Falta configurar la variable de entorno ${nombre}.`);
  return valor;
}

export function obtenerConfiguracionSesion(): ConfiguracionSesion {
  const secreto = leerVariable("AUTH_SECRET");
  const horas = Number(leerVariable("SESSION_DURATION_HOURS"));

  if (Buffer.byteLength(secreto, "utf8") < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 bytes.");
  }
  if (!Number.isSafeInteger(horas) || horas < 1 || horas > 168) {
    throw new Error("SESSION_DURATION_HOURS debe estar entre 1 y 168.");
  }

  return { secreto, duracionSegundos: horas * 60 * 60 };
}
