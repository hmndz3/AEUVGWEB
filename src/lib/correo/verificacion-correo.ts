import type { ProveedorCorreo } from "@/lib/correo/proveedor-correo";

function escaparHtml(valor: string): string {
  return valor.replace(/[&<>'"]/g, (caracter) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entidades[caracter];
  });
}

export async function enviarCorreoVerificacion({
  proveedor,
  destinatario,
  nombre,
  token,
  urlAplicacion,
  minutosVigencia,
}: {
  proveedor: ProveedorCorreo;
  destinatario: string;
  nombre: string;
  token: string;
  urlAplicacion: string;
  minutosVigencia: number;
}) {
  const enlace = new URL("/verificar-correo", urlAplicacion);
  enlace.searchParams.set("token", token);
  const nombreSeguro = escaparHtml(nombre);
  const enlaceSeguro = escaparHtml(enlace.toString());

  await proveedor.enviar({
    destinatario,
    asunto: "Verifica tu cuenta de AEUVG",
    texto: `Hola ${nombre}. Verifica tu cuenta en ${enlace.toString()} Este enlace vence en ${minutosVigencia} minutos y solo puede utilizarse una vez.`,
    html: `<p>Hola ${nombreSeguro},</p><p>Confirma tu correo institucional para activar tu cuenta de AEUVG.</p><p><a href="${enlaceSeguro}">Verificar mi cuenta</a></p><p>Este enlace vence en ${minutosVigencia} minutos y solo puede utilizarse una vez.</p>`,
  });
}
