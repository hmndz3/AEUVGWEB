import Link from "next/link";

import { FiltrosHorasBecaPanel } from "@/components/admin/filtros-horas-beca";
import { ResumenHorasBecaPanel } from "@/components/admin/resumen-horas-beca";
import { TablaHorasBeca } from "@/components/admin/tabla-horas-beca";
import { Paginacion } from "@/components/eventos/paginacion";
import { Boton } from "@/components/ui/boton";
import {
  listarRegistrosHoraBeca,
  obtenerResumenHorasBeca,
} from "@/lib/horas-beca/consultas-horas-beca";
import {
  contarFiltrosHoras,
  interpretarFiltrosHorasBeca,
  parametrosDeFiltrosHoras,
} from "@/validators/horas-beca";

export const dynamic = "force-dynamic";

export default async function PaginaAdminHorasBeca({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const filtros = interpretarFiltrosHorasBeca(parametros);

  const filtrosActivos = contarFiltrosHoras(filtros);

  const [pagina, resumen] = await Promise.all([
    listarRegistrosHoraBeca({ filtros }),
    obtenerResumenHorasBeca(filtros),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">Horas beca</h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
            Registro y acreditación de las horas de servicio del estudiantado. Los registros se
            identifican por carnet, de modo que puedan cargarse antes de que el estudiante tenga
            cuenta en la plataforma.
          </p>
        </div>

        <Link href="/admin/horas-beca/nuevo">
          <Boton>Registrar horas</Boton>
        </Link>
      </div>

      <ResumenHorasBecaPanel resumen={resumen} />

      <FiltrosHorasBecaPanel filtros={filtros} />

      <p className="text-texto-suave text-sm">
        {pagina.total === 0
          ? "Sin registros"
          : `${pagina.total} ${pagina.total === 1 ? "registro" : "registros"}`}
      </p>

      {pagina.registros.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-14 text-center text-sm">
          {filtrosActivos > 0
            ? "Ningún registro coincide con la búsqueda o los filtros aplicados. Prueba con un periodo más amplio o límpialos para ver todos."
            : "Todavía no hay horas beca registradas. Crea el primero con el botón de arriba."}
        </div>
      ) : (
        <TablaHorasBeca registros={pagina.registros} />
      )}

      <Paginacion
        pagina={pagina.pagina}
        paginas={pagina.paginas}
        ruta="/admin/horas-beca"
        parametros={parametrosDeFiltrosHoras(filtros)}
        etiqueta="Páginas de registros de horas beca"
      />
    </div>
  );
}
