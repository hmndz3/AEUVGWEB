import type { ResumenPrograma } from "@/lib/horas-beca/consultas-reportes";
import { formatearFechaActividad, formatearHoras } from "@/lib/horas-beca/formato-horas";

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
      <p className="text-texto-suave mt-1 text-xs">{detalle}</p>
    </div>
  );
}

/** Periodo que realmente abarcan los registros, con sus propias fechas. */
function periodoDe(resumen: ResumenPrograma): string {
  if (!resumen.primeraActividad || !resumen.ultimaActividad) return "Sin actividades registradas";

  const inicio = formatearFechaActividad(resumen.primeraActividad);
  const fin = formatearFechaActividad(resumen.ultimaActividad);

  return inicio === fin ? inicio : `Del ${inicio} al ${fin}`;
}

/**
 * Indicadores del programa de horas beca.
 *
 * Son los seis números con los que AEUVG rinde cuentas: cuántas horas se
 * realizaron, cuántas están reconocidas, cuántas faltan, a cuánta gente
 * alcanzó el programa y a cuántos carnets les falta cuenta en la plataforma.
 *
 * Los estudiantes se cuentan por carnet distinto y no por registro: un
 * estudiante con quince apoyos es una persona, no quince.
 */
export function ResumenPrograma({ resumen }: { resumen: ResumenPrograma }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador
          titulo="Horas registradas"
          valor={formatearHoras(resumen.horasTotales)}
          detalle={`${resumen.registros} ${resumen.registros === 1 ? "registro" : "registros"}`}
        />
        <Indicador
          titulo="Horas acreditadas"
          valor={formatearHoras(resumen.horasAcreditadas)}
          detalle="Ya reconocidas por AEUVG"
        />
        <Indicador
          titulo="Horas pendientes"
          valor={formatearHoras(resumen.horasPendientes)}
          detalle="A la espera de acreditación"
        />
        <Indicador
          titulo="Estudiantes"
          valor={String(resumen.estudiantes)}
          detalle="Carnets distintos con horas en el periodo"
        />
        <Indicador
          titulo="Carnets sin cuenta"
          valor={String(resumen.carnetsSinCuenta)}
          detalle={`${resumen.registrosSinCuenta} ${resumen.registrosSinCuenta === 1 ? "registro" : "registros"} a la espera de que su dueño se registre`}
        />
      </div>

      <p className="text-texto-suave text-xs">Periodo con actividad: {periodoDe(resumen)}.</p>
    </div>
  );
}
