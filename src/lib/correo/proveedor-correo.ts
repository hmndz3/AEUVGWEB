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
      throw new Error(`Resend rechazó el envío (HTTP ${respuesta.status}).`);
    }
  }
}

/**
 * "AEUVG <aeuvg@gmail.com>" como nombre y dirección, que es como los pide
 * Brevo. Sin los signos, el valor completo es la dirección y el nombre queda
 * en AEUVG.
 */
export function interpretarRemitente(valor: string): { name: string; email: string } {
  const coincidencia = /^\s*(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/.exec(valor);

  if (coincidencia) {
    return { name: coincidencia[1].replace(/^"|"$/g, "") || "AEUVG", email: coincidencia[2] };
  }

  return { name: "AEUVG", email: valor.trim() };
}

/**
 * Brevo, por su API HTTP. Es el proveedor de producción mientras AEUVG no
 * tenga un dominio propio: a diferencia de Resend, permite enviar a cualquier
 * destinatario desde una sola dirección verificada (por ejemplo una cuenta de
 * Gmail de la asociación). Se usa la API y no SMTP porque Railway bloquea el
 * SMTP saliente en el plan Hobby.
 */
class ProveedorCorreoBrevo implements ProveedorCorreo {
  constructor(
    private readonly claveApi: string,
    private readonly remitente: string
  ) {}

  async enviar(correo: CorreoSaliente): Promise<void> {
    const respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.claveApi,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: interpretarRemitente(this.remitente),
        to: [{ email: correo.destinatario }],
        subject: correo.asunto,
        textContent: correo.texto,
        htmlContent: correo.html,
      }),
    });

    if (!respuesta.ok) {
      // El código basta para diagnosticar (401 clave inválida, 400 remitente
      // sin verificar) sin escribir en el registro datos del destinatario.
      throw new Error(`Brevo rechazó el envío (HTTP ${respuesta.status}).`);
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

  if (proveedor === "brevo") {
    const claveApi = process.env.BREVO_API_KEY?.trim();
    const remitente = process.env.EMAIL_FROM?.trim();

    if (!claveApi || !remitente) {
      throw new Error("BREVO_API_KEY y EMAIL_FROM son obligatorias para usar Brevo.");
    }

    return new ProveedorCorreoBrevo(claveApi, remitente);
  }

  throw new Error("EMAIL_PROVIDER debe ser 'memory', 'resend' o 'brevo'.");
}
