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

export async function enviarCorreoRecuperacion({
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
  const enlace = new URL("/restablecer-contrasena", urlAplicacion);
  enlace.searchParams.set("token", token);
  const nombreSeguro = escaparHtml(nombre);
  const enlaceSeguro = escaparHtml(enlace.toString());

  await proveedor.enviar({
    destinatario,
    asunto: "Restablece tu contraseña de AEUVG",
    texto: `Hola ${nombre}. Solicitaste restablecer tu contraseña de AEUVG. Usa ${enlace.toString()} Este enlace vence en ${minutosVigencia} minutos y solo puede utilizarse una vez. Si no lo solicitaste, ignora este mensaje.`,
    html: `<p>Hola ${nombreSeguro},</p><p>Recibimos una solicitud para restablecer tu contraseña de AEUVG.</p><p><a href="${enlaceSeguro}">Restablecer mi contraseña</a></p><p>Este enlace vence en ${minutosVigencia} minutos y solo puede utilizarse una vez.</p><p>Si no solicitaste el cambio, puedes ignorar este mensaje: tu contraseña actual sigue siendo válida.</p>`,
  });
}
