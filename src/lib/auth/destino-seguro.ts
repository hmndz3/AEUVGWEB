/**
 * Valida el destino recibido tras iniciar sesión. Solo se acepta una ruta
 * interna: cualquier valor absoluto o protocolo-relativo permitiría enviar al
 * usuario a un sitio externo desde un enlace de apariencia legítima.
 */
export function destinoSeguro(valor: string | null | undefined, alternativa = "/"): string {
  if (!valor) return alternativa;
  if (!valor.startsWith("/")) return alternativa;
  if (valor.startsWith("//") || valor.startsWith("/\\")) return alternativa;

  return valor;
}
