import { formatearHoras } from "@/lib/horas-beca/formato-horas";
import type { ResumenHorasBeca } from "@/lib/horas-beca/consultas-horas-beca";

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
      <p className="text-texto-suave mt-1 text-xs">{detalle}</p>
    </div>
  );
}

/**
 * Totales del periodo consultado.
 *
 * Acompañan al listado porque la pregunta que AEUVG trae al abrir la sección no
 * es qué dice una fila, sino cuántas horas lleva un periodo y cuántas faltan por
 * acreditar. Los números corresponden a todos los registros que pasan los
 * filtros, no a los de la página en pantalla.
 */
export function ResumenHorasBecaPanel({ resumen }: { resumen: ResumenHorasBeca }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador
        titulo="Horas registradas"
        valor={formatearHoras(resumen.horasTotales)}
        detalle={`${resumen.registros} ${resumen.registros === 1 ? "registro" : "registros"} en el periodo consultado`}
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
        titulo="Sin cuenta vinculada"
        valor={String(resumen.registrosSinCuenta)}
        detalle="Carnets que todavía no se han registrado"
      />
    </div>
  );
}
