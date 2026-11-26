"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  construirMes,
  DIAS_CORTOS,
  esDiaElegible,
  formatearDiaLargo,
  hoyEnGuatemala,
  nombreDelMes,
  partesDeIso,
  primerDiaElegible,
  type LimitesDia,
} from "@/lib/ui/calendario-selector";

const claseDisparador =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors focus:ring-2 focus:outline-none";

/** Icono de calendario dibujado a mano: no se agrega una librería por tres trazos. */
function IconoCalendario() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="text-texto-suave size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="2.75" y="4.25" width="14.5" height="13" rx="2.5" />
      <path d="M2.75 8.25h14.5M6.75 2.75v3M13.25 2.75v3" />
    </svg>
  );
}

/**
 * Selector de día.
 *
 * Sustituye al campo de fecha del navegador, que lo dibuja el sistema
 * operativo: no admite los colores del sitio, se rotula en el idioma del
 * equipo —en inglés, con el mes antes del día— y no deja bloquear unos días
 * sí y otros no. Esto último es lo que permite que la solicitud de tutoría
 * ofrezca únicamente los días en los que el tutor publicó disponibilidad.
 *
 * El valor entra y sale como `YYYY-MM-DD`, igual que el campo nativo, así que
 * reemplazarlo no cambia nada de lo que ya envían los formularios.
 */
export function SelectorFecha({
  id,
  valor,
  onCambiar,
  limites = {},
  placeholder = "Elige una fecha",
  invalido = false,
  name,
}: {
  id: string;
  valor: string;
  onCambiar: (iso: string) => void;
  limites?: LimitesDia;
  placeholder?: string;
  invalido?: boolean;
  /**
   * Nombre del campo cuando el selector va dentro de un formulario enviado
   * por GET, como los buscadores del sitio: el disparador es un botón, así que
   * el valor viaja en un campo oculto.
   */
  name?: string;
}) {
  const idRejilla = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);

  const hoy = hoyEnGuatemala();

  // El calendario abre en el mes de lo ya elegido; si no hay nada, en el del
  // primer día que se pueda elegir, para no abrir en una rejilla toda en gris.
  const [mesVisible, setMesVisible] = useState(() => {
    const referencia = partesDeIso(valor) ?? partesDeIso(primerDiaElegible(hoy, limites) ?? hoy);
    return referencia
      ? { anio: referencia.anio, mes: referencia.mes }
      : { anio: new Date().getUTCFullYear(), mes: new Date().getUTCMonth() };
  });

  useEffect(() => {
    if (!abierto) return;

    const alHacerClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionar);

    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionar);
    };
  }, [abierto]);

  const dias = useMemo(
    () => construirMes(mesVisible.anio, mesVisible.mes),
    [mesVisible.anio, mesVisible.mes]
  );

  const mover = (salto: number) =>
    setMesVisible(({ anio, mes }) => {
      const fecha = new Date(Date.UTC(anio, mes + salto, 1));
      return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() };
    });

  const elegir = (iso: string) => {
    onCambiar(iso);
    setAbierto(false);
  };

  return (
    <div ref={contenedor} className="relative">
      {name && <input type="hidden" name={name} value={valor} />}

      <button
        id={id}
        type="button"
        onClick={() => {
          // Al abrir se salta al mes de lo elegido, por si cambió desde fuera.
          // Se hace aquí y no en un efecto, que encadenaría un render de más.
          if (!abierto) {
            const referencia =
              partesDeIso(valor) ?? partesDeIso(primerDiaElegible(hoy, limites) ?? hoy);
            if (referencia) setMesVisible({ anio: referencia.anio, mes: referencia.mes });
          }
          setAbierto((previo) => !previo);
        }}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`${claseDisparador} ${invalido ? "border-error" : ""}`}
      >
        <span className={valor ? "text-texto first-letter:uppercase" : "text-texto-suave"}>
          {valor ? formatearDiaLargo(valor) : placeholder}
        </span>
        <IconoCalendario />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir una fecha"
          className="border-borde bg-superficie absolute z-30 mt-2 w-[19rem] rounded-2xl border p-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Mes anterior"
              className="text-texto-suave hover:bg-superficie-suave hover:text-texto grid size-8 place-items-center rounded-full transition-colors"
            >
              ‹
            </button>
            <p className="text-texto text-sm font-bold first-letter:uppercase">
              {nombreDelMes(mesVisible.anio, mesVisible.mes)}
            </p>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Mes siguiente"
              className="text-texto-suave hover:bg-superficie-suave hover:text-texto grid size-8 place-items-center rounded-full transition-colors"
            >
              ›
            </button>
          </div>

          <div id={idRejilla} className="mt-3 grid grid-cols-7 gap-0.5 text-center text-xs">
            {DIAS_CORTOS.map((dia) => (
              <span key={dia} className="text-texto-suave py-1 font-bold">
                {dia}
              </span>
            ))}

            {dias.map((dia) => {
              const elegible = esDiaElegible(dia, limites);
              const seleccionado = dia.iso === valor;
              const esHoy = dia.iso === hoy;

              return (
                <button
                  key={dia.iso}
                  type="button"
                  disabled={!elegible}
                  aria-current={esHoy ? "date" : undefined}
                  aria-pressed={seleccionado}
                  aria-label={formatearDiaLargo(dia.iso)}
                  onClick={() => elegir(dia.iso)}
                  className={`grid size-9 place-items-center rounded-full text-sm transition-colors ${
                    seleccionado
                      ? "bg-primario font-bold text-white"
                      : elegible
                        ? "text-texto hover:bg-primario-suave"
                        : "text-texto-suave cursor-not-allowed opacity-35"
                  } ${!dia.delMes && !seleccionado ? "opacity-45" : ""} ${
                    esHoy && !seleccionado ? "ring-primario/40 ring-1" : ""
                  }`}
                >
                  {dia.numero}
                </button>
              );
            })}
          </div>

          {/* Cuando el día de hoy no se puede elegir —porque el tutor no da
              tutorías ese día— el atajo sobra y confundiría. */}
          <div className="border-borde mt-3 flex items-center justify-between border-t pt-2">
            {valor ? (
              <button
                type="button"
                onClick={() => elegir("")}
                className="text-texto-suave hover:text-texto text-xs font-semibold"
              >
                Limpiar
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => {
                const siguiente = primerDiaElegible(hoy, limites);
                if (siguiente) elegir(siguiente);
              }}
              className="text-primario text-xs font-bold hover:underline"
            >
              Lo más próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
