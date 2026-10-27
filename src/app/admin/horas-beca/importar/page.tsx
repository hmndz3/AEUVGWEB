import Link from "next/link";

import { ImportarHorasBeca } from "@/components/admin/importar-horas-beca";
import { COLUMNAS_IMPORTACION } from "@/lib/horas-beca/importacion";

export const dynamic = "force-dynamic";

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/horas-beca" className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          Importar horas beca
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Carga una hoja de Excel con los registros de horas. El archivo debe traer estas columnas,
          en cualquier orden: {COLUMNAS_IMPORTACION.join(", ")}.
        </p>
        <a
          href="/api/admin/horas-beca/plantilla"
          className="text-primario mt-3 inline-flex text-sm font-bold hover:underline"
        >
          Descargar la plantilla de Excel
        </a>
      </div>

      <ImportarHorasBeca />
    </div>
  );
}
