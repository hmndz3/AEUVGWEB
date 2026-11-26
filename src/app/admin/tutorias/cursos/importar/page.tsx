import Link from "next/link";

import { ImportarDesdeExcel } from "@/components/admin/importar-desde-excel";
import { COLUMNAS_CURSOS } from "@/lib/tutorias/columnas-importacion-cursos";

export const dynamic = "force-dynamic";

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/tutorias/cursos"
          className="text-primario text-sm font-bold hover:underline"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">Importar cursos</h1>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Carga el catálogo completo de una vez en lugar de agregar los cursos uno por uno. El
          archivo debe traer estas dos columnas, en cualquier orden: {COLUMNAS_CURSOS.join(" y ")}.
        </p>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Los cursos cuyo código ya esté en el catálogo se omiten, así que puedes volver a cargar el
          mismo archivo cuando le agregues cursos sin duplicar los de antes.
        </p>
        {/* Enlace normal y no <Link>: es una descarga que resuelve el servidor,
            no una navegación de la aplicación. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/tutorias/cursos/plantilla"
          className="text-primario mt-3 inline-flex text-sm font-bold hover:underline"
        >
          Descargar la plantilla de Excel
        </a>
      </div>

      <ImportarDesdeExcel
        endpoint="/api/admin/tutorias/cursos/importar"
        textos={{
          singular: "curso",
          plural: "cursos",
          referencia: "Código",
          nota: "quedan activos en el catálogo",
        }}
      />
    </div>
  );
}
