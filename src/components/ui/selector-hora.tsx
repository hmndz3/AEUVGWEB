"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatearHora12, horasDisponibles } from "@/lib/ui/calendario-selector";

const claseDisparador =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition-colors focus:ring-2 focus:outline-none";

/** Icono de reloj dibujado a mano, a juego con el del calendario. */
function IconoReloj() {
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
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.75V10l2.75 1.75" />
    </svg>
  );
}

/**
 * Selector de hora.
 *
 * Sustituye al campo de hora del navegador por la misma razón que el de
 * fecha: lo dibuja el sistema operativo, no admite los colores del sitio y no
 * deja acotar el rango de forma visible. Aquí las horas fuera de la franja del
 * tutor directamente no se ofrecen, en lugar de dejar escribirlas y rechazarlas
 * al enviar.
 *
 * El valor entra y sale como "HH:MM" en 24 horas, igual que el campo nativo,
 * pero se presenta en doce con a.m. y p.m., que es como se lee un horario en
 * Guatemala.
 */
export function SelectorHora({
  id,
  valor,
  onCambiar,
  minimo,
  maximo,
  paso = 30,
  placeholder = "Hora",
  invalido = false,
  name,
}: {
  id: string;
  valor: string;
  onCambiar: (hora: string) => void;
  /** Primera hora que se ofrece, en "HH:MM". */
  minimo?: string;
  maximo?: string;
  /** Minutos entre una opción y la siguiente. */
  paso?: number;
  placeholder?: string;
  invalido?: boolean;
  /**
   * Nombre del campo cuando el selector va dentro de un formulario enviado
   * por GET, como los buscadores del sitio: el disparador es un botón, así que
   * el valor viaja en un campo oculto.
   */
  name?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [abierto, setAbierto] = useState(false);

  const horas = useMemo(() => horasDisponibles(paso, minimo, maximo), [paso, minimo, maximo]);

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

  // La lista se abre con la hora elegida a la vista: con franjas largas, el
  // valor podía quedar fuera de la parte visible y parecía que no había nada.
  useEffect(() => {
    if (!abierto || !lista.current) return;

    const elegida = lista.current.querySelector<HTMLElement>('[data-elegida="si"]');
    elegida?.scrollIntoView({ block: "center" });
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      {name && <input type="hidden" name={name} value={valor} />}

      <button
        id={id}
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`${claseDisparador} ${invalido ? "border-error" : ""}`}
      >
        <span className={valor ? "text-texto" : "text-texto-suave"}>
          {valor ? formatearHora12(valor) : placeholder}
        </span>
        <IconoReloj />
      </button>

      {abierto && (
        <ul
          ref={lista}
          role="listbox"
          aria-label="Elegir una hora"
          className="border-borde bg-superficie absolute z-30 mt-2 max-h-64 w-full min-w-40 overflow-auto rounded-2xl border p-1 shadow-lg"
        >
          {horas.length === 0 ? (
            <li className="text-texto-suave px-3 py-2 text-sm">No hay horas disponibles.</li>
          ) : (
            horas.map((hora) => {
              const elegida = hora === valor;

              return (
                <li key={hora}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={elegida}
                    data-elegida={elegida ? "si" : "no"}
                    onClick={() => {
                      onCambiar(hora);
                      setAbierto(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      elegida
                        ? "bg-primario font-bold text-white"
                        : "text-texto hover:bg-superficie-suave"
                    }`}
                  >
                    <span>{formatearHora12(hora)}</span>
                    <span className={elegida ? "text-white/70" : "text-texto-suave"}>{hora}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
