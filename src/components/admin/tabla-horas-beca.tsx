import Link from "next/link";

import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { RegistroHoraBecaAdmin } from "@/lib/horas-beca/consultas-horas-beca";
import { formatearFechaActividad, formatearHoras } from "@/lib/horas-beca/formato-horas";
import { ETIQUETAS_ESTADO_HORA_BECA } from "@/validators/horas-beca";

/**
 * Tabla de registros de horas beca.
 *
 * Es más densa que el resto de los listados del panel y presenta todas las
 * columnas de la hoja de cálculo que sustituye: quien la usa compara filas entre
 * sí, así que esconder columnas detrás de un detalle la haría inservible. En
 * teléfono la tabla se desplaza en horizontal, como las demás, en lugar de
 * convertirse en tarjetas que impedirían esa comparación.
 */
export function TablaHorasBeca({ registros }: { registros: RegistroHoraBecaAdmin[] }) {
  return (
    <Tabla className="min-w-[56rem]">
      <TablaEncabezado>
        <tr>
          <TablaCeldaEncabezado>Carnet</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Estudiante</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Horario</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Actividad</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Horas</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
        </tr>
      </TablaEncabezado>
      <TablaCuerpo>
        {registros.map((registro) => (
          <TablaFila key={registro.idRegistroHora}>
            <TablaCelda className="text-texto font-semibold whitespace-nowrap">
              {registro.carnet}
            </TablaCelda>
            <TablaCelda className="text-texto">
              {registro.nombreCuenta ?? registro.nombreEstudiante}
            </TablaCelda>
            <TablaCelda className="text-texto-suave whitespace-nowrap">
              {formatearFechaActividad(registro.fechaActividad)}
            </TablaCelda>
            <TablaCelda className="text-texto-suave whitespace-nowrap">
              {registro.horarioApoyo}
            </TablaCelda>
            <TablaCelda className="text-texto-suave">
              <span className="block max-w-sm truncate" title={registro.descripcionActividad}>
                {registro.descripcionActividad}
              </span>
            </TablaCelda>
            <TablaCelda className="text-texto text-right font-semibold whitespace-nowrap">
              {formatearHoras(registro.cantidadHoras)}
            </TablaCelda>
            <TablaCelda>
              <EtiquetaEstado tono={registro.estado === "ACREDITADA" ? "acreditada" : "pendiente"}>
                {ETIQUETAS_ESTADO_HORA_BECA[registro.estado]}
              </EtiquetaEstado>
            </TablaCelda>
            <TablaCelda className="text-right whitespace-nowrap">
              {/* La corrección se abre desde la fila, que es donde AEUVG detecta
                  el dato equivocado al comparar un periodo completo. */}
              <Link
                href={`/admin/horas-beca/${registro.idRegistroHora}`}
                className="text-primario text-sm font-bold hover:underline"
              >
                Editar
              </Link>
            </TablaCelda>
          </TablaFila>
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}
