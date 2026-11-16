import { protegerRuta } from "@/lib/auth/guardias";
import { contarNoLeidas } from "@/lib/notificaciones/consultas-notificaciones";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Cuántos avisos sin leer tiene la cuenta.
 *
 * Es lo único que el encabezado necesita: el contenido se lee en su pantalla,
 * y traerlo entero en cada carga del sitio sería pedir cincuenta avisos para
 * pintar un número.
 */
export const GET = protegerRuta([], async (usuario) => {
  try {
    return Response.json(
      { sinLeer: await contarNoLeidas(usuario.idUsuario) },
      { headers: sinCache }
    );
  } catch {
    // El contador es un adorno: si falla, el encabezado se presenta sin él.
    return Response.json({ sinLeer: 0 }, { headers: sinCache });
  }
});
