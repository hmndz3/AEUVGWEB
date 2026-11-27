import { cookies } from "next/headers";

import { crearServicioAutenticacion } from "@/lib/auth/crear-servicio-autenticacion";
import type { UsuarioSesion } from "@/lib/auth/repositorio-autenticacion";
import { type Rol, tieneRol } from "@/lib/auth/roles";
import { NOMBRE_COOKIE_SESION } from "@/lib/auth/sesion";
import { origenPermitido, respuestaOrigenInvalido } from "@/lib/seguridad/origen";

export type ResultadoGuardia =
  | { tipo: "autorizado"; usuario: UsuarioSesion }
  | { tipo: "sin_sesion" }
  | { tipo: "sin_permiso"; usuario: UsuarioSesion };

/**
 * Decide el acceso a partir del usuario resuelto. Se mantiene separado de la
 * lectura de la cookie para poder probar la política sin montar una petición.
 * Sin roles requeridos basta con tener una sesión válida.
 */
export function decidirAcceso(
  usuario: UsuarioSesion | null,
  rolesRequeridos: readonly Rol[] = []
): ResultadoGuardia {
  if (!usuario) return { tipo: "sin_sesion" };
  if (rolesRequeridos.length > 0 && !tieneRol(usuario.roles, rolesRequeridos)) {
    return { tipo: "sin_permiso", usuario };
  }

  return { tipo: "autorizado", usuario };
}

/**
 * Resuelve la sesión desde la cookie y aplica la política de acceso.
 *
 * La autorización se decide siempre aquí, en el servidor: el menú del
 * encabezado y el middleware solo mejoran la experiencia, no protegen.
 */
export async function verificarAcceso(
  rolesRequeridos: readonly Rol[] = []
): Promise<ResultadoGuardia> {
  const almacen = await cookies();
  const usuario = await crearServicioAutenticacion().obtenerUsuarioSesion(
    almacen.get(NOMBRE_COOKIE_SESION)?.value
  );

  return decidirAcceso(usuario, rolesRequeridos);
}

/**
 * Aplica la política de acceso sobre un manejador de API, tomando el acceso de
 * quien se le indique. Responde 401 sin sesión y 404 sin permiso, para no
 * revelar que la ruta existe a quien no puede usarla.
 *
 * Recibe el resolvedor como parámetro para poder probar la protección sin
 * montar una petición ni una base de datos.
 */
export function protegerConAcceso<T extends unknown[]>(
  obtenerAcceso: (rolesRequeridos: readonly Rol[]) => Promise<ResultadoGuardia>,
  rolesRequeridos: readonly Rol[],
  manejador: (usuario: UsuarioSesion, ...argumentos: T) => Promise<Response>
) {
  return async (...argumentos: T): Promise<Response> => {
    // Antes que el permiso, el origen: una petición que viene de otra página no
    // se atiende aunque la sesión sea válida, porque la sesión sería de quien
    // la sufre y no de quien la lanza.
    const solicitud = argumentos.find(
      (argumento): argumento is Request & T[number] => argumento instanceof Request
    );
    if (solicitud && !origenPermitido(solicitud)) return respuestaOrigenInvalido();

    const acceso = await obtenerAcceso(rolesRequeridos);

    if (acceso.tipo === "sin_sesion") {
      return Response.json(
        { mensaje: "Inicia sesión para continuar." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (acceso.tipo === "sin_permiso") {
      return Response.json(
        { mensaje: "No encontrado." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return manejador(acceso.usuario, ...argumentos);
  };
}

/** Envuelve un manejador de API para que solo se ejecute con los roles indicados. */
export function protegerRuta<T extends unknown[]>(
  rolesRequeridos: readonly Rol[],
  manejador: (usuario: UsuarioSesion, ...argumentos: T) => Promise<Response>
) {
  return protegerConAcceso(verificarAcceso, rolesRequeridos, manejador);
}
