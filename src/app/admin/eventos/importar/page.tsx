import Link from "next/link";

import { ImportarDesdeExcel } from "@/components/admin/importar-desde-excel";
import { COLUMNAS_IMPORTACION_EVENTOS } from "@/lib/eventos/columnas-importacion";

export const dynamic = "force-dynamic";

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/eventos" className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">Importar eventos</h1>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Carga una hoja de Excel con varios eventos de una vez. Cada organizador puede llenar la
          plantilla con sus actividades y aquí se suben todas juntas. El archivo debe traer estas
          columnas, en cualquier orden: {COLUMNAS_IMPORTACION_EVENTOS.join(", ")}.
        </p>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          La imagen va como enlace: súbela a Drive, OneDrive o Dropbox, compártela como «cualquiera
          con el enlace» y pega la dirección. La plataforma la descarga al cargar el archivo y la
          guarda, así que después el enlace ya no hace falta. Los eventos entran como borrador y no
          se ven en el sitio hasta publicarlos.
        </p>
        {/* Enlace normal y no <Link>: es una descarga que resuelve el servidor,
            no una navegación de la aplicación. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/eventos/plantilla"
          className="text-primario mt-3 inline-flex text-sm font-bold hover:underline"
        >
          Descargar la plantilla de Excel
        </a>
      </div>

      <ImportarDesdeExcel
        endpoint="/api/admin/eventos/importar"
        textos={{
          singular: "evento",
          plural: "eventos",
          referencia: "Evento",
          nota: "quedan como borrador hasta que los publiques",
        }}
      />
    </div>
  );
}
