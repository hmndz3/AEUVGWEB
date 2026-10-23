"use client";

import { useEffect, useId, useRef, useState } from "react";

import { inicialesDe } from "@/lib/auth/usuario-sesion-cliente";
import type { EstudianteSugerido } from "@/lib/horas-beca/consultas-estudiantes";

/**
 * Letras mínimas para pedir sugerencias. Coincide con el mínimo del servidor
 * (MINIMO_BUSQUEDA_ESTUDIANTE), que no se importa aquí porque ese módulo
 * arrastra el cliente de la base y esto corre en el navegador.
 */
const MINIMO_PARA_SUGERIR = 2;

/** Milisegundos de espera antes de consultar, para no pedir por cada tecla. */
const ESPERA_CONSULTA = 250;

/**
 * Buscador de estudiantes por carnet, con sus sugerencias.
 *
 * Se escribió a mano en lugar de usar el <datalist> del navegador porque ese
 * elemento lo dibuja el sistema operativo: no admite los colores del sitio ni
 * puede mostrar nada más que texto. Aquí cada sugerencia lleva su avatar y su
 * nombre, con los mismos tonos del resto del panel.
 *
 * La plataforma no guarda fotografías de los estudiantes, así que el avatar son
 * sus iniciales sobre el color primario, igual que en el encabezado y en el
 * perfil.
 *
 * El campo sigue siendo de texto libre a propósito: este módulo existe para
 * poder registrar horas de un carnet que todavía no tiene cuenta, y un
 * desplegable cerrado lo impediría.
 */
export function BuscadorEstudiante({
  id,
  valor,
  onCambiar,
  onElegir,
}: {
  id: string;
  valor: string;
  onCambiar: (carnet: string) => void;
  onElegir: (estudiante: EstudianteSugerido) => void;
}) {
  const idLista = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const [sugerencias, setSugerencias] = useState<EstudianteSugerido[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(-1);

  const normalizado = valor.trim().toUpperCase();
  const cuenta = sugerencias.find((estudiante) => estudiante.carnet.toUpperCase() === normalizado);

  useEffect(() => {
    const texto = valor.trim();
    const controlador = new AbortController();

    // Todo ocurre dentro del temporizador, incluido el vaciado: cambiar el
    // estado en el cuerpo del efecto encadena un render de más por cada tecla.
    const temporizador = setTimeout(() => {
      if (texto.length < MINIMO_PARA_SUGERIR) {
        setSugerencias([]);
        return;
      }

      fetch(`/api/admin/estudiantes?q=${encodeURIComponent(texto)}`, {
        signal: controlador.signal,
      })
        .then((respuesta) => (respuesta.ok ? respuesta.json() : { estudiantes: [] }))
        .then((cuerpo: { estudiantes?: EstudianteSugerido[] }) => {
          setSugerencias(cuerpo.estudiantes ?? []);
          setResaltado(-1);
        })
        .catch(() => {
          // El buscador es una ayuda: si la consulta falla, el carnet se sigue
          // pudiendo escribir a mano.
          if (!controlador.signal.aborted) setSugerencias([]);
        });
    }, ESPERA_CONSULTA);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [valor]);

  // Se cierra al hacer clic fuera, como el menú de la cuenta.
  useEffect(() => {
    if (!abierto) return;

    const alHacerClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClic);
    return () => document.removeEventListener("mousedown", alHacerClic);
  }, [abierto]);

  const elegir = (estudiante: EstudianteSugerido) => {
    onElegir(estudiante);
    setAbierto(false);
    setResaltado(-1);
  };

  const alPresionar = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "Escape") {
      setAbierto(false);
      return;
    }
    if (sugerencias.length === 0) return;

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      setAbierto(true);
      setResaltado((actual) => {
        const paso = evento.key === "ArrowDown" ? 1 : -1;
        return (actual + paso + sugerencias.length) % sugerencias.length;
      });
      return;
    }

    if (evento.key === "Enter" && abierto && resaltado >= 0) {
      // Solo se intercepta el Enter cuando hay una sugerencia marcada; de lo
      // contrario el formulario se enviaría o no, según el navegador.
      evento.preventDefault();
      elegir(sugerencias[resaltado]);
    }
  };

  const visibles = abierto && sugerencias.length > 0;

  return (
    <div ref={contenedor} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={visibles}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={resaltado >= 0 ? `${idLista}-${resaltado}` : undefined}
        autoComplete="off"
        maxLength={20}
        value={valor}
        onChange={(evento) => {
          onCambiar(evento.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alPresionar}
        className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
      />

      {visibles && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Estudiantes registrados"
          className="border-borde bg-superficie absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-2xl border p-1 shadow-lg"
        >
          {sugerencias.map((estudiante, indice) => (
            <li key={estudiante.carnet}>
              <button
                type="button"
                id={`${idLista}-${indice}`}
                role="option"
                aria-selected={indice === resaltado}
                // onMouseDown y no onClick: el clic cierra el desplegable al
                // perder el foco el campo, y el botón ya no estaría para recibirlo.
                onMouseDown={(evento) => {
                  evento.preventDefault();
                  elegir(estudiante);
                }}
                onMouseEnter={() => setResaltado(indice)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  indice === resaltado ? "bg-primario-suave" : "hover:bg-superficie-suave"
                }`}
              >
                <span
                  aria-hidden
                  className="bg-primario grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                >
                  {inicialesDe(estudiante.nombreCompleto)}
                </span>
                <span className="min-w-0">
                  <span className="text-texto block truncate text-sm font-semibold">
                    {estudiante.nombreCompleto}
                  </span>
                  <span className="text-texto-suave block text-xs">{estudiante.carnet}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cuenta && !visibles && (
        <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-[#00695a]">
          <span
            aria-hidden
            className="bg-turquesa/20 grid size-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold text-[#00695a]"
          >
            {inicialesDe(cuenta.nombreCompleto)}
          </span>
          Cuenta encontrada: {cuenta.nombreCompleto}
        </p>
      )}
    </div>
  );
}
