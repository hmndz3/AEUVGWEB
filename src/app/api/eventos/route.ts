import { listarEventosPublicados } from "@/lib/eventos/consultas-eventos";

export const runtime = "nodejs";

/**
 * Listado público de eventos. No exige sesión porque el calendario y la
 * cartelera son contenido abierto del sitio; solo devuelve eventos publicados.
 */
export async function GET(solicitud: Request) {
  const parametros = new URL(solicitud.url).searchParams;
  const pagina = Number(parametros.get("pagina"));

  const resultado = await listarEventosPublicados({
    pagina: Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1,
  });

  return Response.json(resultado, {
    // Un minuto de caché compartida alcanza para absorber los picos de
    // navegación sin que un evento recién publicado tarde en aparecer.
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}
