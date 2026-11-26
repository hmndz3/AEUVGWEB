"use client";

import { useMemo, useState } from "react";

import {
  construirRejillaTurnos,
  type BloqueRejilla,
  type RejillaTurnos as Rejilla,
  type TurnoUbicable,
} from "@/lib/prestamo-batas/rejilla-turnos";
import type { DiaSemana } from "@prisma/client";

/** Los días que comparten el mismo horario de atención. */
const ENTRE_SEMANA: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

/**
 * Horario del salón: los bloques de hora en el costado y los días arriba.
 *
 * Antes los turnos se listaban uno debajo de otro y había que leerlos enteros
 * para ubicar una hora. Puesto como cuadrícula se reconoce de un vistazo, que
 * es como la gente lee un horario.
 *
 * El fin de semana va en su propia tabla, a la derecha: el sábado se abre a
 * otras horas, y meterlo en la misma cuadrícula obligaba a dibujar sus bloques
 * como filas que quedaban vacías de lunes a viernes, de modo que la mitad del
 * horario eran casillas sin nada. Separados, cada tabla enseña solo sus horas.
 *
 * En el teléfono no caben seis columnas sin volver ilegible la letra, así que
 * ahí se escoge el día con una pestaña y se ven sus bloques; es el mismo
 * horario, visto un día a la vez, y la ambigüedad no se da.
 *
 * El contenido de cada casilla lo pone quien usa la cuadrícula: el estudiantado
 * ve quién atiende, el postulante una casilla para marcar y el panel los
 * botones de edición.
 */
export function RejillaTurnos<T extends TurnoUbicable>({
  turnos,
  casilla,
  casillaVacia,
  vacio = "Todavía no hay turnos de atención publicados.",
}: {
  turnos: T[];
  casilla: (turno: T) => React.ReactNode;
  /** Qué dibujar donde ese día no abre. Sin esto la casilla queda en blanco. */
  casillaVacia?: (dia: DiaSemana, bloque: BloqueRejilla) => React.ReactNode;
  vacio?: React.ReactNode;
}) {
  const { completa, semana, finDeSemana } = useMemo(
    () => ({
      completa: construirRejillaTurnos(turnos),
      semana: construirRejillaTurnos(turnos.filter((turno) => ENTRE_SEMANA.includes(turno.dia))),
      finDeSemana: construirRejillaTurnos(
        turnos.filter((turno) => !ENTRE_SEMANA.includes(turno.dia))
      ),
    }),
    [turnos]
  );

  const [diaActivo, setDiaActivo] = useState<DiaSemana | null>(null);

  if (completa.columnas.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        {vacio}
      </div>
    );
  }

  const dia = diaActivo ?? completa.columnas[0].dia;
  const delDia = completa.bloques
    .map((bloque) => ({ bloque, turno: completa.celda(dia, bloque.clave) }))
    .filter((fila) => fila.turno !== null);

  return (
    <div className="flex flex-col gap-4">
      {/* Teléfono: un día a la vez. */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {completa.columnas.map((columna) => (
            <button
              key={columna.dia}
              type="button"
              onClick={() => setDiaActivo(columna.dia)}
              aria-pressed={columna.dia === dia}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                columna.dia === dia
                  ? "bg-primario text-white"
                  : "border-borde bg-superficie text-texto-suave hover:bg-superficie-suave border"
              }`}
            >
              {columna.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {delDia.map(({ bloque, turno }) => (
            <div key={bloque.clave} className="flex items-stretch gap-3">
              <span className="text-texto-suave w-16 shrink-0 pt-3 text-xs leading-tight font-bold">
                {bloque.horaInicio}
                <br />
                {bloque.horaFin}
              </span>
              <div className="min-w-0 flex-1">{turno !== null && casilla(turno)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Escritorio: entre semana a la izquierda y el fin de semana a la derecha.
          Cada tabla crece según cuántos días tenga, para que las columnas
          queden del mismo ancho en las dos. */}
      <div className="hidden items-start gap-4 md:flex">
        {[semana, finDeSemana]
          .filter((rejilla) => rejilla.columnas.length > 0)
          .map((rejilla) => (
            <Cuadricula
              key={rejilla.columnas[0].dia}
              rejilla={rejilla}
              casilla={casilla}
              casillaVacia={casillaVacia}
            />
          ))}
      </div>
    </div>
  );
}

/** Una de las dos tablas del horario, con sus propios bloques de hora. */
function Cuadricula<T extends TurnoUbicable>({
  rejilla,
  casilla,
  casillaVacia,
}: {
  rejilla: Rejilla<T>;
  casilla: (turno: T) => React.ReactNode;
  casillaVacia?: (dia: DiaSemana, bloque: BloqueRejilla) => React.ReactNode;
}) {
  return (
    <div
      className="border-borde bg-superficie grid overflow-hidden rounded-[1.25rem] border"
      style={{
        // La columna de horas no cuenta para el reparto: lo que se iguala entre
        // las dos tablas es el ancho de los días.
        flex: `${rejilla.columnas.length} 1 0`,
        gridTemplateColumns: `4.5rem repeat(${rejilla.columnas.length}, minmax(0, 1fr))`,
      }}
    >
      <span className="border-borde bg-superficie-suave border-r border-b" />
      {rejilla.columnas.map((columna) => (
        <span
          key={columna.dia}
          className="border-borde bg-superficie-suave text-texto border-b px-2 py-2.5 text-center text-sm font-bold"
        >
          {columna.etiqueta}
        </span>
      ))}

      {rejilla.bloques.map((bloque, indice) => (
        <Fila
          key={bloque.clave}
          bloque={bloque}
          ultima={indice === rejilla.bloques.length - 1}
          columnas={rejilla.columnas.map((columna) => columna.dia)}
          rejilla={rejilla}
          casilla={casilla}
          casillaVacia={casillaVacia}
        />
      ))}
    </div>
  );
}

/**
 * Una fila de la cuadrícula. Va aparte porque las casillas son hijas directas
 * de la rejilla —no pueden ir envueltas en un contenedor propio— y así cada
 * fila se arma sin repetir el recorrido de los días.
 */
function Fila<T extends TurnoUbicable>({
  bloque,
  ultima,
  columnas,
  rejilla,
  casilla,
  casillaVacia,
}: {
  bloque: BloqueRejilla;
  /** La última fila no lleva línea abajo: ahí ya está el borde de la tarjeta. */
  ultima: boolean;
  columnas: DiaSemana[];
  rejilla: Rejilla<T>;
  casilla: (turno: T) => React.ReactNode;
  casillaVacia?: (dia: DiaSemana, bloque: BloqueRejilla) => React.ReactNode;
}) {
  const linea = ultima ? "" : "border-b";

  return (
    <>
      <span
        className={`border-borde text-texto-suave flex flex-col justify-center border-r px-2 py-3 text-center text-xs leading-tight font-bold ${linea}`}
      >
        <span>{bloque.horaInicio}</span>
        <span className="opacity-60">a</span>
        <span>{bloque.horaFin}</span>
      </span>

      {columnas.map((dia) => {
        const turno = rejilla.celda(dia, bloque.clave);

        return (
          <span key={dia} className={`border-borde p-1.5 ${linea}`}>
            {turno !== null ? casilla(turno) : (casillaVacia?.(dia, bloque) ?? null)}
          </span>
        );
      })}
    </>
  );
}
