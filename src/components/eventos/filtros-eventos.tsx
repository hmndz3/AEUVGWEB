import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import type { CategoriaResumen, OrganizadoresDisponibles } from "@/lib/eventos/consultas-eventos";
import {
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
 * sigue funcionando aunque el JavaScript no haya cargado todavía.
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
  return (
    <form
      method="get"
      action="/eventos"
      className="border-borde bg-superficie rounded-[1.25rem] border p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5 lg:col-span-3">
          <Etiqueta htmlFor="q">Buscar</Etiqueta>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            maxLength={MAXIMO_BUSQUEDA}
            placeholder="Nombre, descripción o lugar del evento"
            className={claseCampo}
          />
        </div>

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
    </form>
  );
}
