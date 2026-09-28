import Link from "next/link";

import { Boton } from "@/components/ui/boton";

/**
 * Buscador del listado de organizaciones. Es un formulario común, sin
 * JavaScript propio: al enviarlo el navegador arma la dirección y la página se
 * vuelve a generar en el servidor, de modo que el resultado siempre sea
 * compartible por enlace.
 */
export function BuscadorOrganizaciones({
  ruta,
  busqueda,
  etiqueta,
}: {
  ruta: string;
  busqueda: string | undefined;
  etiqueta: string;
}) {
  return (
    <form method="get" action={ruta} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <label htmlFor="q" className="text-texto text-sm font-semibold">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={busqueda ?? ""}
          placeholder={etiqueta}
          className="border-borde bg-superficie text-texto placeholder:text-texto-suave focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <Boton type="submit" variante="contorno">
        Buscar
      </Boton>
      {busqueda && (
        <Link href={ruta} className="text-primario px-2 py-3 text-sm font-bold hover:underline">
          Limpiar
        </Link>
      )}
    </form>
  );
}
