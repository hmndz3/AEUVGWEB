import { ExportarHorasBeca } from "@/components/admin/exportar-horas-beca";
import { FiltrosReportePanel } from "@/components/admin/filtros-reporte";
import { HorasPorEstudiante } from "@/components/admin/horas-por-estudiante";
import { HorasPorMes } from "@/components/admin/horas-por-mes";
import { ResumenPrograma } from "@/components/admin/resumen-programa";
import {
  MAXIMO_ESTUDIANTES_REPORTE,
  obtenerHorasPorEstudiante,
  obtenerHorasPorMes,
  obtenerResumenPrograma,
} from "@/lib/horas-beca/consultas-reportes";
import { interpretarFiltrosReporte, parametrosDeFiltrosHoras } from "@/validators/horas-beca";

export const dynamic = "force-dynamic";

export default async function PaginaAdminReportes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = interpretarFiltrosReporte(await searchParams);

  const [resumen, meses, estudiantes] = await Promise.all([
    obtenerResumenPrograma(filtros),
    obtenerHorasPorMes(filtros),
    obtenerHorasPorEstudiante(filtros),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Reportes</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Cómo va el programa de horas beca en conjunto. Los totales abarcan todos los registros,
          vengan del formulario del panel o de una importación.
        </p>
      </div>

      <FiltrosReportePanel filtros={filtros} />

      <ResumenPrograma resumen={resumen} />

      {/* La descarga arrastra el periodo del reporte, de modo que el archivo
          contenga los registros que componen los totales en pantalla. */}
      {resumen.registros > 0 && (
        <ExportarHorasBeca parametros={parametrosDeFiltrosHoras(filtros)} />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-texto text-lg font-bold">Horas por mes</h2>
        <HorasPorMes meses={meses} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-texto text-lg font-bold">Horas por estudiante</h2>
        <HorasPorEstudiante estudiantes={estudiantes} maximo={MAXIMO_ESTUDIANTES_REPORTE} />
      </div>
    </div>
  );
}
