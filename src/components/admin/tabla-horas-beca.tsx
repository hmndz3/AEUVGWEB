"use client";

import Link from "next/link";
import { useState } from "react";

import { AccionesHoraBeca } from "@/components/admin/acciones-hora-beca";
import { BarraAcreditacion } from "@/components/admin/barra-acreditacion";
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

const claseCasilla =
  "border-borde text-primario focus-visible:ring-primario size-4 rounded border focus-visible:ring-2 focus-visible:ring-offset-2";

/**
 * Tabla de registros de horas beca.
 *
 * Es más densa que el resto de los listados del panel y presenta todas las
 * columnas de la hoja de cálculo que sustituye: quien la usa compara filas entre
 * sí, así que esconder columnas detrás de un detalle la haría inservible. En
 * teléfono la tabla se desplaza en horizontal, como las demás, en lugar de
 * convertirse en tarjetas que impedirían esa comparación.
 *
 * La selección vive en el cliente porque solo sirve para la operación en lote
 * que se está a punto de aplicar: no tiene sentido conservarla en la dirección
 * ni en el servidor. La página monta la tabla con una clave que cambia con los
 * filtros, de modo que cambiar de página o de filtro descarte la selección en
 * lugar de acreditar a ciegas registros que ya no están en pantalla.
 */
export function TablaHorasBeca({ registros }: { registros: RegistroHoraBecaAdmin[] }) {
  const [seleccion, setSeleccion] = useState<ReadonlySet<number>>(new Set());

  const todos =
    registros.length > 0 && registros.every((fila) => seleccion.has(fila.idRegistroHora));

  const alternar = (id: number) =>
    setSeleccion((previa) => {
      const siguiente = new Set(previa);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });

  const alternarTodos = () =>
    setSeleccion(todos ? new Set() : new Set(registros.map((fila) => fila.idRegistroHora)));

  return (
    <div className="flex flex-col gap-4">
      <BarraAcreditacion
        seleccionados={[...seleccion]}
        horasSeleccionadas={registros
          .filter((fila) => seleccion.has(fila.idRegistroHora))
          .reduce((total, fila) => total + fila.cantidadHoras, 0)}
        alLimpiar={() => setSeleccion(new Set())}
      />

      <Tabla className="min-w-[60rem]">
        <TablaEncabezado>
          <tr>
            <TablaCeldaEncabezado className="w-10">
              <input
                type="checkbox"
                checked={todos}
                onChange={alternarTodos}
                aria-label="Seleccionar todos los registros de la página"
                className={claseCasilla}
              />
            </TablaCeldaEncabezado>
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
            <TablaFila
              key={registro.idRegistroHora}
              className={
                seleccion.has(registro.idRegistroHora) ? "bg-primario-suave/40" : undefined
              }
            >
              <TablaCelda>
                <input
                  type="checkbox"
                  checked={seleccion.has(registro.idRegistroHora)}
                  onChange={() => alternar(registro.idRegistroHora)}
                  aria-label={`Seleccionar el registro del carnet ${registro.carnet} del ${formatearFechaActividad(registro.fechaActividad)}`}
                  className={claseCasilla}
                />
              </TablaCelda>
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
                <EtiquetaEstado
                  tono={registro.estado === "ACREDITADA" ? "acreditada" : "pendiente"}
                >
                  {ETIQUETAS_ESTADO_HORA_BECA[registro.estado]}
                </EtiquetaEstado>
              </TablaCelda>
              <TablaCelda className="whitespace-nowrap">
                <div className="flex items-start justify-end gap-3">
                  {/* La corrección se abre desde la fila, que es donde AEUVG
                      detecta el dato equivocado al comparar un periodo completo. */}
                  <Link
                    href={`/admin/horas-beca/${registro.idRegistroHora}`}
                    className="text-primario text-sm font-bold hover:underline"
                  >
                    Editar
                  </Link>
                  <AccionesHoraBeca id={registro.idRegistroHora} carnet={registro.carnet} />
                </div>
              </TablaCelda>
            </TablaFila>
          ))}
        </TablaCuerpo>
      </Tabla>
    </div>
  );
}
