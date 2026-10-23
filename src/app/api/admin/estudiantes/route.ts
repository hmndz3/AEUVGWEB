import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { buscarEstudiantes } from "@/lib/horas-beca/consultas-estudiantes";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Sugiere estudiantes ya registrados mientras se escribe el carnet.
 *
 * Solo para administradores: el listado relaciona carnets con nombres, que no
 * es información que deba poder recorrer cualquiera con sesión. Responde una
 * lista vacía cuando el texto es demasiado corto, en lugar de devolver a todo
 * el estudiantado.
 */
export const GET = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const texto = new URL(solicitud.url).searchParams.get("q") ?? "";

  try {
    return Response.json({ estudiantes: await buscarEstudiantes(texto) }, { headers: sinCache });
  } catch {
    // El buscador es una ayuda, no un requisito: si la base no responde, el
    // formulario sigue permitiendo escribir el carnet a mano.
    return Response.json({ estudiantes: [] }, { status: 503, headers: sinCache });
  }
});
