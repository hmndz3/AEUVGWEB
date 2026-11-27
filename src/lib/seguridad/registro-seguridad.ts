/**
 * Registro de los hechos de seguridad.
 *
 * Es A09 del OWASP Top 10: sin una huella de los intentos fallidos, de los
 * accesos denegados y de los topes que saltan, un ataque en curso no se
 * distingue de un día normal, y después no hay con qué reconstruir qué pasó.
 *
 * Sale por la salida de errores del proceso, que es lo que Railway recoge y
 * conserva. No se guarda en la base a propósito: estos hechos tienen que poder
 * anotarse aunque la base sea justamente lo que está fallando.
 *
 * Lo que nunca entra aquí: contraseñas, tokens, cookies ni el contenido de lo
 * que alguien envió. El correo va recortado, porque sirve para seguir un
 * intento repetido sin dejar el directorio de la universidad en los registros.
 */

export const HECHOS = {
  accesoFallido: "acceso_fallido",
  accesoCorrecto: "acceso_correcto",
  limiteAlcanzado: "limite_alcanzado",
  permisoDenegado: "permiso_denegado",
  origenRechazado: "origen_rechazado",
  subidaRechazada: "subida_rechazada",
} as const;

export type Hecho = (typeof HECHOS)[keyof typeof HECHOS];

export type DetalleHecho = {
  /** Dirección desde la que llegó la petición, tal como la da el proxy. */
  direccion?: string;
  /** Correo recortado con `recortarCorreo`, nunca el completo. */
  correo?: string;
  ruta?: string;
  idUsuario?: number;
  motivo?: string;
};

/**
 * Deja del correo lo justo para reconocer que dos intentos son del mismo sitio
 * sin escribir la dirección entera: "est…@uvg.edu.gt".
 */
export function recortarCorreo(correo: string): string {
  const [usuario, dominio] = correo.split("@");
  if (!dominio) return "desconocido";

  return `${usuario.slice(0, 3)}…@${dominio}`;
}

/**
 * Anota un hecho de seguridad.
 *
 * Una línea por hecho, en JSON, para poder filtrarla después sin leerla a ojo.
 */
export function registrarHecho(hecho: Hecho, detalle: DetalleHecho = {}): void {
  const linea = {
    tipo: "seguridad",
    hecho,
    momento: new Date().toISOString(),
    ...detalle,
  };

  console.warn(JSON.stringify(linea));
}
