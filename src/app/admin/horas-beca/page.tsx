import { FiltrosHorasBecaPanel } from "@/components/admin/filtros-horas-beca";
import { ResumenHorasBecaPanel } from "@/components/admin/resumen-horas-beca";
import { TablaHorasBeca } from "@/components/admin/tabla-horas-beca";
import { Paginacion } from "@/components/eventos/paginacion";
import {
  listarRegistrosHoraBeca,
  obtenerResumenHorasBeca,
} from "@/lib/horas-beca/consultas-horas-beca";
import { interpretarFiltrosHorasBeca, parametrosDeFiltrosHoras } from "@/validators/horas-beca";

export const dynamic = "force-dynamic";

export default async function PaginaAdminHorasBeca({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const filtros = interpretarFiltrosHorasBeca(parametros);

  const [pagina, resumen] = await Promise.all([
    listarRegistrosHoraBeca({ filtros }),
    obtenerResumenHorasBeca(filtros),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Horas beca</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Registro y acreditación de las horas de servicio del estudiantado. Los registros se
          identifican por carnet, de modo que puedan cargarse antes de que el estudiante tenga
          cuenta en la plataforma.
        </p>
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
          {filtros.q
            ? "Ningún registro coincide con la búsqueda. Revisa el carnet o el nombre."
            : "Todavía no hay horas beca registradas."}
        </div>
      ) : (
        <TablaHorasBeca registros={pagina.registros} />
      )}

      <Paginacion
        pagina={pagina.pagina}
        paginas={pagina.paginas}
        ruta="/admin/horas-beca"
        parametros={parametrosDeFiltrosHoras(filtros)}
      />
    </div>
  );
}
