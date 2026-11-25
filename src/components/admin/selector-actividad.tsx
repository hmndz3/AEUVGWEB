"use client";

import { Fragment, useId, useMemo, useState } from "react";

import { normalizarTexto } from "@/lib/busqueda-texto";
import type { EventoDeActividad } from "@/lib/horas-beca/actividad-evento";
import { ACTIVIDAD_OTRA } from "@/lib/horas-beca/formato-horas";

const TEXTO_OTRA = "Otra actividad (no fue un evento)";

/** Eventos que se dibujan a la vez; los demás aparecen al escribir. */
const MAXIMO_VISIBLES = 60;

/** "2026-10-09" como "09/10/2026", para la lista de eventos. */
const fechaCorta = (dia: string) => dia.split("-").reverse().join("/");

const etiquetaEvento = (evento: EventoDeActividad) =>
  `${fechaCorta(evento.fecha)} · ${evento.nombre}`;

type Opcion = { valor: string; etiqueta: string; fecha: string | null; nombre: string };

/**
 * Selector de la actividad de un registro de horas: una lista de eventos en la
 * que también se puede escribir para filtrarla.
 *
 * Con meses de eventos la lista se vuelve larga, y recorrerla con la rueda era
 * la forma más lenta de encontrar uno. Al escribir se filtra por nombre o por
 * fecha, sin distinguir acentos ni mayúsculas, y "Otra actividad" se ofrece
 * siempre al final para los apoyos que no fueron un evento.
 */
export function SelectorActividad({
  id,
  valor,
  eventos,
  etiquetaActual,
  onElegir,
}: {
  id: string;
  /** Identificador del evento elegido, ACTIVIDAD_OTRA o vacío. */
  valor: string;
  eventos: EventoDeActividad[];
  /** Cómo nombrar un evento elegido que ya no está en la lista. */
  etiquetaActual: string;
  onElegir: (valor: string) => void;
}) {
  const idLista = useId();
  const [texto, setTexto] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(-1);

  const opciones = useMemo<Opcion[]>(
    () =>
      eventos.map((evento) => ({
        valor: String(evento.idEvento),
        etiqueta: etiquetaEvento(evento),
        fecha: fechaCorta(evento.fecha),
        nombre: evento.nombre,
      })),
    [eventos]
  );

  const elegida = opciones.find((opcion) => opcion.valor === valor);
  const etiquetaElegida =
    valor === ""
      ? ""
      : valor === ACTIVIDAD_OTRA
        ? TEXTO_OTRA
        : (elegida?.etiqueta ?? etiquetaActual);

  // Mientras no se escribe, el campo muestra lo elegido; al escribir, lo escrito.
  const consulta = texto === null ? "" : normalizarTexto(texto);
  const coincidentes = consulta
    ? opciones.filter((opcion) =>
        normalizarTexto(`${opcion.fecha} ${opcion.nombre}`).includes(consulta)
      )
    : opciones;
  const visibles: Opcion[] = [
    ...coincidentes.slice(0, MAXIMO_VISIBLES),
    { valor: ACTIVIDAD_OTRA, etiqueta: TEXTO_OTRA, fecha: null, nombre: TEXTO_OTRA },
  ];
  const ocultos = coincidentes.length - Math.min(coincidentes.length, MAXIMO_VISIBLES);

  function elegir(opcion: Opcion) {
    onElegir(opcion.valor);
    setTexto(null);
    setAbierto(false);
    setResaltado(-1);
  }

  function cerrar() {
    setTexto(null);
    setAbierto(false);
    setResaltado(-1);
  }

  function alPresionar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      cerrar();
      return;
    }

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      setAbierto(true);
      setResaltado((actual) => {
        const paso = evento.key === "ArrowDown" ? 1 : -1;
        return (actual + paso + visibles.length) % visibles.length;
      });
      return;
    }

    // Enter elige la opción marcada o, si el filtro dejó un solo evento, ese.
    // Nunca envía el formulario desde aquí: con el desplegable abierto, un
    // Enter que guardara a medio elegir sería una sorpresa.
    if (evento.key === "Enter" && abierto) {
      evento.preventDefault();
      const opcion =
        resaltado >= 0 ? visibles[resaltado] : coincidentes.length === 1 ? visibles[0] : null;
      if (opcion) elegir(opcion);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={resaltado >= 0 ? `${idLista}-${resaltado}` : undefined}
          aria-required
          autoComplete="off"
          // Abierto, el campo es un buscador vacío y lo elegido queda como
          // indicación; cerrado, vuelve a mostrar lo elegido.
          placeholder={etiquetaElegida || "Escribe para buscar el evento por nombre o fecha"}
          value={texto ?? etiquetaElegida}
          onChange={(evento) => {
            const escrito = evento.target.value;
            // Tras elegir con Enter el foco sigue en el campo y muestra lo
            // elegido: lo que se escriba entonces empieza una búsqueda nueva en
            // lugar de sumarse al nombre del evento.
            setTexto(
              texto === null && etiquetaElegida && escrito.startsWith(etiquetaElegida)
                ? escrito.slice(etiquetaElegida.length)
                : escrito
            );
            setAbierto(true);
            setResaltado(-1);
          }}
          onFocus={() => {
            setTexto("");
            setAbierto(true);
          }}
          onClick={() => {
            if (!abierto) {
              setTexto("");
              setAbierto(true);
            }
          }}
          onBlur={cerrar}
          onKeyDown={alPresionar}
          className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border py-3 pr-10 pl-4 text-sm focus:ring-2 focus:outline-none"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`text-texto-suave pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {abierto && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Eventos"
          className="border-borde bg-superficie absolute z-20 mt-1.5 max-h-80 w-full overflow-auto rounded-2xl border p-1 shadow-lg"
        >
          {coincidentes.length === 0 && (
            <li className="text-texto-suave px-3 py-2 text-sm">
              Ningún evento coincide con «{texto?.trim()}».
            </li>
          )}
          {visibles.map((opcion, indice) => {
            const esOtra = opcion.valor === ACTIVIDAD_OTRA;

            return (
              <Fragment key={opcion.valor}>
                {esOtra && ocultos > 0 && (
                  <li className="text-texto-suave px-3 py-2 text-xs">
                    Y {ocultos} {ocultos === 1 ? "evento más" : "eventos más"}: escribe para
                    encontrarlos.
                  </li>
                )}
                <li className={esOtra ? "border-borde mt-1 border-t pt-1" : ""}>
                  <button
                    type="button"
                    id={`${idLista}-${indice}`}
                    role="option"
                    aria-selected={opcion.valor === valor}
                    tabIndex={-1}
                    // onMouseDown y no onClick: el clic cierra el desplegable al
                    // perder el foco el campo, y la opción ya no estaría.
                    onMouseDown={(evento) => {
                      evento.preventDefault();
                      elegir(opcion);
                    }}
                    onMouseEnter={() => setResaltado(indice)}
                    className={`flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      indice === resaltado ? "bg-primario-suave" : "hover:bg-superficie-suave"
                    } ${opcion.valor === valor ? "font-semibold" : ""}`}
                  >
                    {esOtra ? (
                      <span className="text-primario font-semibold">{TEXTO_OTRA}</span>
                    ) : (
                      <>
                        <span className="text-texto-suave shrink-0 font-mono text-xs">
                          {opcion.fecha}
                        </span>
                        <span className="text-texto min-w-0">{opcion.nombre}</span>
                      </>
                    )}
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
