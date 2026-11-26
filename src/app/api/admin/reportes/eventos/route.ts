import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import { obtenerEventosDelReporte } from "@/lib/eventos/consultas-reporte-eventos";
import {
  aFilaExportacionEvento,
  generarCsvEventos,
  nombreArchivoEventos,
} from "@/lib/eventos/exportacion-eventos";
import { generarExcelEventos } from "@/lib/eventos/exportar-excel-eventos";
import { interpretarFiltrosEventosReporte } from "@/validators/reporte-eventos";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Tipo de contenido y extensión de cada formato. */
const SALIDAS = {
  csv: { tipo: "text/csv; charset=utf-8", extension: "csv" },
  excel: {
    tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  },
} as const;

type Formato = keyof typeof SALIDAS;

function interpretarFormato(valor: string | null): Formato | null {
  return valor === "csv" || valor === "excel" ? valor : null;
}

/**
 * Descarga el reporte de eventos en el formato pedido.
 *
 * Los filtros se leen de la misma dirección que la pantalla, así que lo que se
 * descarga es exactamente lo que el panel está mostrando.
 */
export const GET = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const parametros = new URL(solicitud.url).searchParams;
  const formato = interpretarFormato(parametros.get("formato"));

  if (!formato) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  try {
    const resultado = await obtenerEventosDelReporte(interpretarFiltrosEventosReporte(parametros));

    if (resultado.tipo === "demasiados") {
      return Response.json(
        {
          mensaje:
            `El reporte abarca ${resultado.total} eventos y el máximo son ${resultado.maximo}. ` +
            "Acota el periodo o aplica un filtro y vuelve a intentarlo.",
        },
        { status: 413, headers: sinCache }
      );
    }

    const filas = resultado.eventos.map((evento) => aFilaExportacionEvento(evento));
    const salida = SALIDAS[formato];
    const cuerpo =
      formato === "csv"
        ? generarCsvEventos(filas)
        : await generarExcelEventos(filas, resultado.eventos);

    return new Response(cuerpo as BodyInit, {
      headers: {
        ...sinCache,
        "Content-Type": salida.tipo,
        "Content-Disposition": `attachment; filename="${nombreArchivoEventos(salida.extension)}"`,
      },
    });
  } catch (error) {
    console.error("Fallo al exportar eventos:", error instanceof Error ? error.message : error);

    return Response.json(
      { mensaje: "No se pudo generar la descarga. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
