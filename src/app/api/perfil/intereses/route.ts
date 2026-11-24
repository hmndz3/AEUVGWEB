import { protegerRuta } from "@/lib/auth/guardias";
import { guardarInteresesDeCategorias } from "@/lib/personalizacion/consultas-personalizacion";
import { MAXIMO_INTERESES, normalizarSeleccion } from "@/lib/personalizacion/intereses";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/**
 * Guarda las categorías de evento que le interesan a la cuenta de la sesión.
 *
 * La selección reemplaza a la anterior: es una lista corta de casillas, y
 * resolver altas y bajas por separado tendría más que salir mal y nada que
 * ganar. Una lista vacía es válida y significa no recibir recomendaciones.
 */
export const PUT = protegerRuta([], async (usuario, solicitud: Request) => {
  const cuerpo = (await solicitud.json().catch(() => null)) as { categorias?: unknown } | null;

  if (!Array.isArray(cuerpo?.categorias)) {
    return Response.json(
      { mensaje: "Envía la lista de categorías que te interesan." },
      { status: 422, headers: sinCache }
    );
  }

  const categorias = normalizarSeleccion(cuerpo.categorias);

  if (cuerpo.categorias.length > MAXIMO_INTERESES) {
    return Response.json(
      { mensaje: `No puedes elegir más de ${MAXIMO_INTERESES} categorías.` },
      { status: 422, headers: sinCache }
    );
  }

  try {
    const guardadas = await guardarInteresesDeCategorias(usuario.idUsuario, categorias);

    return Response.json({ guardadas }, { headers: sinCache });
  } catch {
    return Response.json(
      { mensaje: "No se pudieron guardar tus intereses. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
