import { protegerRuta } from "@/lib/auth/guardias";
import { ROLES } from "@/lib/auth/roles";
import {
  nombreArchivoExportacion,
  obtenerContenidoExportacion,
} from "@/lib/horas-beca/exportacion";
import { generarCsv } from "@/lib/horas-beca/exportar-csv";
import { generarExcel } from "@/lib/horas-beca/exportar-excel";
import { generarPdf } from "@/lib/horas-beca/exportar-pdf";
import { interpretarFiltrosHorasBeca, interpretarFormato } from "@/validators/horas-beca";

export const runtime = "nodejs";

const sinCache = { "Cache-Control": "no-store" };

/** Tipo de contenido y extensión de cada formato. */
const SALIDAS = {
  csv: { tipo: "text/csv; charset=utf-8", extension: "csv" },
  excel: {
    tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  },
  pdf: { tipo: "application/pdf", extension: "pdf" },
} as const;

/**
 * Descarga los registros de horas beca en el formato pedido.
 *
 * Los filtros se leen de la misma dirección que el listado, así que lo que se
 * descarga es exactamente lo que el panel está mostrando. Un formato que no se
 * reconozca responde como no encontrado, en lugar de caer a uno por omisión que
 * nadie pidió.
 */
export const GET = protegerRuta([ROLES.administrador], async (_usuario, solicitud: Request) => {
  const parametros = new URL(solicitud.url).searchParams;
  const formato = interpretarFormato(parametros.get("formato"));

  if (!formato) {
    return Response.json({ mensaje: "No encontrado." }, { status: 404, headers: sinCache });
  }

  try {
    const contenido = await obtenerContenidoExportacion(interpretarFiltrosHorasBeca(parametros));

    if (contenido.tipo === "demasiados") {
      return Response.json(
        {
          mensaje:
            `La exportación abarca ${contenido.total} registros y el máximo son ${contenido.maximo}. ` +
            "Acota el periodo o aplica un filtro y vuelve a intentarlo.",
        },
        { status: 413, headers: sinCache }
      );
    }

    const salida = SALIDAS[formato];
    const cuerpo =
      formato === "csv"
        ? generarCsv(contenido.filas)
        : formato === "excel"
          ? await generarExcel(contenido)
          : await generarPdf(contenido);

    return new Response(cuerpo as BodyInit, {
      headers: {
        ...sinCache,
        "Content-Type": salida.tipo,
        "Content-Disposition": `attachment; filename="${nombreArchivoExportacion(salida.extension)}"`,
      },
    });
  } catch {
    return Response.json(
      { mensaje: "No se pudo generar la exportación. Intenta de nuevo en unos minutos." },
      { status: 503, headers: sinCache }
    );
  }
});
