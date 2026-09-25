import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import type { CategoriaResumen, OrganizadoresDisponibles } from "@/lib/eventos/consultas-eventos";
import {
  contarFiltros,
  ETIQUETAS_TIPO_ACTIVIDAD,
  MAXIMO_BUSQUEDA,
  TIPOS_ACTIVIDAD,
  type FiltrosEventos,
} from "@/validators/eventos";

const claseCampo =
  "border-borde bg-superficie text-texto h-11 w-full rounded-2xl border px-4 text-sm focus:border-primario focus:ring-primario/30 focus:ring-2 focus:outline-none";

function Etiqueta({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-texto text-sm font-semibold">
      {children}
    </label>
  );
}

/**
 * Barra de filtros del listado de eventos.
 *
 * Es un formulario GET normal, sin JavaScript propio: al enviarlo el navegador
 * arma la dirección con los filtros y la página se vuelve a generar en el
 * servidor. Así el resultado siempre es compartible por enlace y la pantalla
 * sigue funcionando aunque el JavaScript no haya cargado.
 *
 * Solo el buscador queda a la vista. El resto de los filtros vive dentro de un
 * bloque plegable, porque al entrar a la cartelera lo que se quiere ver son los
 * eventos, no seis campos vacíos. Se abre solo cuando ya hay filtros aplicados,
 * para que nadie pierda de vista por qué está viendo una lista recortada.
 */
export function FiltrosEventosBarra({
  filtros,
  categorias,
  organizadores,
}: {
  filtros: FiltrosEventos;
  categorias: CategoriaResumen[];
  organizadores: OrganizadoresDisponibles;
}) {
  const activos = contarFiltros(filtros) - (filtros.q ? 1 : 0);

  return (
    <form
      method="get"
      action="/eventos"
      className="border-borde bg-superficie rounded-[1.25rem] border p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="q" className="sr-only">
            Buscar eventos
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            maxLength={MAXIMO_BUSQUEDA}
            placeholder="Buscar por nombre, descripción o lugar"
            className={claseCampo}
          />
        </div>

        <Boton type="submit" className="sm:w-auto">
          Buscar
        </Boton>
      </div>

      <details open={activos > 0} className="group mt-3">
        <summary className="text-texto-suave hover:text-texto inline-flex cursor-pointer list-none items-center gap-2 rounded-full py-1 text-sm font-semibold transition-colors marker:content-none">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ▸
          </span>
          Filtros
          {activos > 0 && (
            <span className="bg-primario-suave text-primario-fuerte rounded-full px-2 py-0.5 text-xs font-bold">
              {activos}
            </span>
          )}
        </summary>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="desde">Desde</Etiqueta>
            <input
              id="desde"
              name="desde"
              type="date"
              defaultValue={filtros.desde ?? ""}
              className={claseCampo}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="hasta">Hasta</Etiqueta>
            <input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={filtros.hasta ?? ""}
              className={claseCampo}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="categoria">Categoría</Etiqueta>
            <select
              id="categoria"
              name="categoria"
              defaultValue={filtros.categoria ? String(filtros.categoria) : ""}
              className={claseCampo}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.idCategoriaEvento} value={categoria.idCategoriaEvento}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="tipo">Tipo de actividad</Etiqueta>
            <select id="tipo" name="tipo" defaultValue={filtros.tipo ?? ""} className={claseCampo}>
              <option value="">Todos los tipos</option>
              {TIPOS_ACTIVIDAD.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_ACTIVIDAD[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="asociacion">Asociación</Etiqueta>
            <select
              id="asociacion"
              name="asociacion"
              defaultValue={filtros.asociacion ? String(filtros.asociacion) : ""}
              className={claseCampo}
            >
              <option value="">Todas las asociaciones</option>
              {organizadores.asociaciones.map((asociacion) => (
                <option key={asociacion.id} value={asociacion.id}>
                  {asociacion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiqueta htmlFor="club">Club</Etiqueta>
            <select
              id="club"
              name="club"
              defaultValue={filtros.club ? String(filtros.club) : ""}
              className={claseCampo}
            >
              <option value="">Todos los clubes</option>
              {organizadores.clubes.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Boton type="submit">Aplicar filtros</Boton>
          <Link href="/eventos" className="text-texto-suave text-sm font-semibold hover:underline">
            Limpiar todo
          </Link>
        </div>
      </details>
    </form>
  );
}
