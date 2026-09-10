export type CorreoSaliente = {
  destinatario: string;
  asunto: string;
  texto: string;
  html: string;
};

export interface ProveedorCorreo {
  enviar(correo: CorreoSaliente): Promise<void>;
}

/**
 * Proveedor local sin salida de red. Conserva los mensajes solo en memoria para
 * pruebas automatizadas; nunca imprime destinatarios, enlaces o tokens.
 */
export class ProveedorCorreoMemoria implements ProveedorCorreo {
  readonly mensajes: CorreoSaliente[] = [];

  async enviar(correo: CorreoSaliente): Promise<void> {
    this.mensajes.push(correo);
  }
}

class ProveedorCorreoResend implements ProveedorCorreo {
  constructor(
    private readonly claveApi: string,
    private readonly remitente: string
  ) {}

  async enviar(correo: CorreoSaliente): Promise<void> {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.claveApi}`,
        "Content-Type": "application/json",
        "User-Agent": "AEUVGWEB/1.0",
      },
      body: JSON.stringify({
        from: this.remitente,
        to: [correo.destinatario],
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
      }),
    });

    if (!respuesta.ok) {
      throw new Error("El proveedor de correo rechazó el envío.");
    }
  }
}

let proveedorMemoria: ProveedorCorreoMemoria | undefined;

export function obtenerProveedorCorreo(): ProveedorCorreo {
  const proveedor = process.env.EMAIL_PROVIDER?.trim().toLocaleLowerCase("en-US");

  if (proveedor === "memory") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_PROVIDER=memory no está permitido en producción.");
    }

    proveedorMemoria ??= new ProveedorCorreoMemoria();
    return proveedorMemoria;
  }

  if (proveedor === "resend") {
    const claveApi = process.env.RESEND_API_KEY?.trim();
    const remitente = process.env.EMAIL_FROM?.trim();

    if (!claveApi || !remitente) {
      throw new Error("RESEND_API_KEY y EMAIL_FROM son obligatorias para usar Resend.");
    }

    return new ProveedorCorreoResend(claveApi, remitente);
  }

  throw new Error("EMAIL_PROVIDER debe ser 'memory' o 'resend'.");
}
