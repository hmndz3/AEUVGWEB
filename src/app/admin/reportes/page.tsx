import { HorasPorMes } from "@/components/admin/horas-por-mes";
import { ResumenPrograma } from "@/components/admin/resumen-programa";
import { obtenerHorasPorMes, obtenerResumenPrograma } from "@/lib/horas-beca/consultas-reportes";

export const dynamic = "force-dynamic";

export default async function PaginaAdminReportes() {
  const [resumen, meses] = await Promise.all([obtenerResumenPrograma(), obtenerHorasPorMes()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Reportes</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Cómo va el programa de horas beca en conjunto. Los totales abarcan todos los registros,
          vengan del formulario del panel o de una importación.
        </p>
      </div>

      <ResumenPrograma resumen={resumen} />

      <div className="flex flex-col gap-3">
        <h2 className="text-texto text-lg font-bold">Horas por mes</h2>
        <HorasPorMes meses={meses} />
      </div>
    </div>
  );
}
