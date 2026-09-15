import { obtenerEventoPublicado } from "@/lib/eventos/consultas-eventos";

export const runtime = "nodejs";

/** Detalle público de un evento publicado. */
export async function GET(_solicitud: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const evento = await obtenerEventoPublicado(Number(id));

  if (!evento) {
    return Response.json(
      { mensaje: "El evento no existe o no está publicado." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(evento, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}
