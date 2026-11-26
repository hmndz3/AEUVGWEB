import Link from "next/link";

import { CampoFecha } from "@/components/ui/campo-fecha";

import { Boton } from "@/components/ui/boton";
import type { FiltrosReporte } from "@/lib/horas-beca/consultas-reportes";

/**
 * Periodo del reporte.
 *
 * Es un formulario común enviado por GET, igual que los filtros del listado: el
 * periodo queda escrito en la dirección, así que el reporte de un semestre se
 * puede guardar o compartir como un enlace, y la página se vuelve a generar en
 * el servidor, que es donde se calculan los totales.
 */
export function FiltrosReportePanel({ filtros }: { filtros: FiltrosReporte }) {
  const acotado = filtros.desde !== undefined || filtros.hasta !== undefined;

  return (
    <form
      method="get"
      action="/admin/reportes"
      className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
    >
      <div className="flex min-w-44 flex-col gap-1.5">
        <label htmlFor="desde" className="text-texto text-sm font-semibold">
          Desde
        </label>
        <CampoFecha id="desde" name="desde" valorInicial={filtros.desde ?? ""} />
      </div>

      <div className="flex min-w-44 flex-col gap-1.5">
        <label htmlFor="hasta" className="text-texto text-sm font-semibold">
          Hasta
        </label>
        <CampoFecha id="hasta" name="hasta" valorInicial={filtros.hasta ?? ""} />
      </div>

      <div className="flex items-center gap-2">
        <Boton type="submit" variante="contorno">
          Acotar periodo
        </Boton>

        {acotado && (
          <Link
            href="/admin/reportes"
            className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
          >
            Ver todo
          </Link>
        )}
      </div>
    </form>
  );
}
