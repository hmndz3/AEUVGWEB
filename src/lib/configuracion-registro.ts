type ConfiguracionRegistro = {
  dominioInstitucional: string;
  urlAplicacion: string;
  minutosVigenciaToken: number;
  segundosEsperaReenvio: number;
  maximosReenviosPorHora: number;
};

function leerVariable(nombre: string): string {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta configurar la variable de entorno ${nombre}.`);
  }

  return valor;
}

function leerEnteroPositivo(nombre: string): number {
  const valor = Number(leerVariable(nombre));

  if (!Number.isSafeInteger(valor) || valor <= 0) {
    throw new Error(`${nombre} debe ser un entero mayor que cero.`);
  }

  return valor;
}

export function obtenerConfiguracionRegistro(): ConfiguracionRegistro {
  const dominioInstitucional = leerVariable("INSTITUTIONAL_EMAIL_DOMAIN")
    .toLocaleLowerCase("en-US")
    .replace(/^@/, "");
  const urlAplicacion = leerVariable("NEXT_PUBLIC_APP_URL");

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(dominioInstitucional)) {
    throw new Error("INSTITUTIONAL_EMAIL_DOMAIN no contiene un dominio válido.");
  }

  try {
    new URL(urlAplicacion);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL no contiene una URL válida.");
  }

  return {
    dominioInstitucional,
    urlAplicacion,
    minutosVigenciaToken: leerEnteroPositivo("EMAIL_VERIFICATION_TOKEN_TTL_MINUTES"),
    segundosEsperaReenvio: leerEnteroPositivo("EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS"),
    maximosReenviosPorHora: leerEnteroPositivo("EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR"),
  };
}
