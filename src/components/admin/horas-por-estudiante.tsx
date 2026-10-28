import Link from "next/link";

import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { ResumenEstudiante } from "@/lib/horas-beca/consultas-reportes";
import { formatearHoras } from "@/lib/horas-beca/formato-horas";

/**
 * Horas por estudiante, de más horas a menos.
 *
 * Cada fila enlaza al listado filtrado por ese carnet, que es lo que AEUVG
 * hace a continuación cuando un total no cuadra: ir a ver los registros que lo
 * componen. Los carnets sin cuenta se señalan, porque son los que no pueden
 * consultar sus horas desde su perfil todavía.
 */
export function HorasPorEstudiante({
  estudiantes,
  maximo,
}: {
  estudiantes: ResumenEstudiante[];
  maximo: number;
}) {
  if (estudiantes.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        No hay estudiantes con horas en el periodo consultado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabla className="min-w-[38rem]">
        <TablaEncabezado>
          <tr>
            <TablaCeldaEncabezado>Carnet</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Estudiante</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Registros</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Horas</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Acreditadas</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Pendientes</TablaCeldaEncabezado>
          </tr>
        </TablaEncabezado>
        <TablaCuerpo>
          {estudiantes.map((fila) => (
            <TablaFila key={fila.carnet}>
              <TablaCelda className="font-mono">
                <Link
                  href={`/admin/horas-beca?q=${encodeURIComponent(fila.carnet)}`}
                  className="text-primario font-bold hover:underline"
                >
                  {fila.carnet}
                </Link>
              </TablaCelda>
              <TablaCelda className="text-texto">
                {fila.estudiante}
                {!fila.vinculado && (
                  <span className="text-texto-suave ml-2 text-xs">(sin cuenta)</span>
                )}
              </TablaCelda>
              <TablaCelda className="text-texto-suave text-right">{fila.registros}</TablaCelda>
              <TablaCelda className="text-texto text-right font-bold">
                {formatearHoras(fila.horasTotales)}
              </TablaCelda>
              <TablaCelda className="text-texto-suave text-right">
                {formatearHoras(fila.horasAcreditadas)}
              </TablaCelda>
              <TablaCelda className="text-texto-suave text-right">
                {formatearHoras(fila.horasPendientes)}
              </TablaCelda>
            </TablaFila>
          ))}
        </TablaCuerpo>
      </Tabla>

      {estudiantes.length === maximo && (
        <p className="text-texto-suave text-xs">
          Se presentan los {maximo} estudiantes con más horas. Para el listado completo, descarga la
          exportación del periodo.
        </p>
      )}
    </div>
  );
}
