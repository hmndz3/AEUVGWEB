import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import { CampoFecha } from "@/components/ui/campo-fecha";
import type { CatalogosReporteEventos } from "@/lib/eventos/consultas-reporte-eventos";
import { ETIQUETAS_TIPO_ACTIVIDAD, TIPOS_ACTIVIDAD } from "@/validators/eventos";
import {
  contarFiltrosEventos,
  ESTADOS_EVENTO,
  ETIQUETAS_ESTADO_EVENTO,
  NOMBRE_AEUVG,
  type FiltrosEventosReporte,
} from "@/validators/reporte-eventos";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 w-full rounded-2xl border px-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Filtros del reporte de eventos.
 *
 * Formulario común enviado por GET, igual que el resto del panel: lo elegido
 * queda escrito en la dirección, así que el reporte de un periodo se puede
 * guardar o compartir como enlace y la descarga arrastra exactamente lo mismo
 * que se está viendo.
 */
export function FiltrosReporteEventos({
  filtros,
  catalogos,
}: {
  filtros: FiltrosEventosReporte;
  catalogos: CatalogosReporteEventos;
}) {
  const acotado = contarFiltrosEventos(filtros) > 0;

  return (
    <form
      method="get"
      action="/admin/reportes/eventos"
      className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
    >
      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor="desde" className="text-texto text-sm font-semibold">
          Desde
        </label>
        <CampoFecha id="desde" name="desde" valorInicial={filtros.desde ?? ""} />
      </div>

      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor="hasta" className="text-texto text-sm font-semibold">
          Hasta
        </label>
        <CampoFecha id="hasta" name="hasta" valorInicial={filtros.hasta ?? ""} />
      </div>

      <div className="flex min-w-48 flex-col gap-1.5">
        <label htmlFor="organizador" className="text-texto text-sm font-semibold">
          Organizador
        </label>
        <select
          id="organizador"
          name="organizador"
          defaultValue={filtros.organizador ?? ""}
          className={claseCampo}
        >
          <option value="">Cualquiera</option>
          {/* El filtro que AEUVG pidió expresamente, primero de la lista. */}
          {catalogos.hayAeuvg && <option value="aeuvg">Solo {NOMBRE_AEUVG}</option>}
          {catalogos.asociaciones.length > 0 && (
            <optgroup label="Asociaciones">
              {catalogos.asociaciones.map((asociacion) => (
                <option key={asociacion.id} value={`asociacion:${asociacion.id}`}>
                  {asociacion.nombre}
                </option>
              ))}
            </optgroup>
          )}
          {catalogos.clubes.length > 0 && (
            <optgroup label="Clubes">
              {catalogos.clubes.map((club) => (
                <option key={club.id} value={`club:${club.id}`}>
                  {club.nombre}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="flex min-w-44 flex-col gap-1.5">
        <label htmlFor="categoria" className="text-texto text-sm font-semibold">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={filtros.categoria ? String(filtros.categoria) : ""}
          className={claseCampo}
        >
          <option value="">Todas</option>
          {catalogos.categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor="tipo" className="text-texto text-sm font-semibold">
          Tipo
        </label>
        <select id="tipo" name="tipo" defaultValue={filtros.tipo ?? ""} className={claseCampo}>
          <option value="">Todos</option>
          {TIPOS_ACTIVIDAD.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS_TIPO_ACTIVIDAD[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor="estado" className="text-texto text-sm font-semibold">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={filtros.estado ?? ""}
          className={claseCampo}
        >
          <option value="">Todos</option>
          {ESTADOS_EVENTO.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETAS_ESTADO_EVENTO[estado]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Boton type="submit" variante="contorno">
          Aplicar filtros
        </Boton>

        {acotado && (
          <Link
            href="/admin/reportes/eventos"
            className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
          >
            Ver todo
          </Link>
        )}
      </div>
    </form>
  );
}
