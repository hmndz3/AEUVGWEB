import Link from "next/link";

import { AccionesOportunidad } from "@/components/admin/acciones-oportunidad";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { OportunidadPanel } from "@/lib/horas-beca/consultas-oportunidades";
import { formatearFechaActividad } from "@/lib/horas-beca/formato-horas";
import { formatearHorarioOportunidad } from "@/lib/horas-beca/horario-oportunidad";
import {
  ETIQUETAS_ESTADO_OPORTUNIDAD,
  type EstadoOportunidadFiltro,
} from "@/validators/oportunidad-admin";

/** Color de cada estado. Publicada es lo que ya está a la vista del estudiantado. */
const TONOS: Record<EstadoOportunidadFiltro, "pendiente" | "acreditada" | "neutro" | "error"> = {
  BORRADOR: "pendiente",
  PUBLICADA: "acreditada",
  CERRADA: "neutro",
  CANCELADA: "error",
  FINALIZADA: "neutro",
};

/**
 * Listado de convocatorias del panel.
 *
 * Presenta las que no están publicadas junto a las que sí, porque el panel es
 * donde se preparan: esconder los borradores obligaría a recordar de memoria lo
 * que quedó a medias.
 */
export function TablaOportunidades({ oportunidades }: { oportunidades: OportunidadPanel[] }) {
  return (
    <Tabla className="min-w-[48rem]">
      <TablaEncabezado>
        <tr>
          <TablaCeldaEncabezado>Actividad</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Fecha y horario</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Lugar</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Cupo</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
        </tr>
      </TablaEncabezado>
      <TablaCuerpo>
        {oportunidades.map((oportunidad) => (
          <TablaFila key={oportunidad.idOportunidad}>
            <TablaCelda>
              <Link
                href={`/admin/horas-beca/oportunidades/${oportunidad.idOportunidad}`}
                className="text-texto font-bold hover:underline"
              >
                {oportunidad.nombre}
              </Link>
              {oportunidad.registros > 0 && (
                <p className="text-texto-suave mt-0.5 text-xs">
                  {oportunidad.registros} {oportunidad.registros === 1 ? "registro" : "registros"}{" "}
                  de horas
                </p>
              )}
            </TablaCelda>
            <TablaCelda className="text-texto-suave">
              {formatearFechaActividad(oportunidad.fecha)}
              <span className="block text-xs">
                {formatearHorarioOportunidad(oportunidad.horaInicio, oportunidad.horaFin)}
              </span>
            </TablaCelda>
            <TablaCelda className="text-texto-suave">{oportunidad.lugar}</TablaCelda>
            <TablaCelda className="text-texto text-right font-bold">
              {oportunidad.cantidadPersonas}
            </TablaCelda>
            <TablaCelda>
              <EtiquetaEstado tono={TONOS[oportunidad.estado]}>
                {ETIQUETAS_ESTADO_OPORTUNIDAD[oportunidad.estado]}
              </EtiquetaEstado>
            </TablaCelda>
            <TablaCelda>
              <AccionesOportunidad
                id={oportunidad.idOportunidad}
                nombre={oportunidad.nombre}
                estado={oportunidad.estado}
                registros={oportunidad.registros}
              />
            </TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}
