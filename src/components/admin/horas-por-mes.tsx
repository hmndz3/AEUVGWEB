import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { ResumenMes } from "@/lib/horas-beca/consultas-reportes";
import { formatearHoras, formatearMes } from "@/lib/horas-beca/formato-horas";

/**
 * Horas por mes, del mes más reciente al más antiguo.
 *
 * Es el desglose que muestra en qué periodos se concentró el apoyo, que es lo
 * que el total del programa no deja ver: dos semestres con las mismas horas
 * pueden haberse repartido de maneras muy distintas.
 */
export function HorasPorMes({ meses }: { meses: ResumenMes[] }) {
  if (meses.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        No hay horas registradas en el periodo consultado.
      </div>
    );
  }

  return (
    <Tabla className="min-w-[32rem]">
      <TablaEncabezado>
        <tr>
          <TablaCeldaEncabezado>Mes</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Registros</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Horas</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Acreditadas</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Pendientes</TablaCeldaEncabezado>
        </tr>
      </TablaEncabezado>
      <TablaCuerpo>
        {meses.map((mes) => (
          <TablaFila key={mes.mes.toISOString()}>
            <TablaCelda className="text-texto font-semibold capitalize">
              {formatearMes(mes.mes)}
            </TablaCelda>
            <TablaCelda className="text-texto-suave text-right">{mes.registros}</TablaCelda>
            <TablaCelda className="text-texto text-right font-bold">
              {formatearHoras(mes.horasTotales)}
            </TablaCelda>
            <TablaCelda className="text-texto-suave text-right">
              {formatearHoras(mes.horasAcreditadas)}
            </TablaCelda>
            <TablaCelda className="text-texto-suave text-right">
              {formatearHoras(mes.horasPendientes)}
            </TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}
