"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  CLAVE_TEMA,
  DESCRIPCIONES_TEMA,
  ETIQUETAS_TEMA,
  esTema,
  resolverTema,
  TEMAS,
  type Tema,
} from "@/lib/ui/tema";

/** Aplica el tema al documento, que es de donde cuelgan las variables de color. */
function aplicar(tema: Tema) {
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.tema = resolverTema(tema, prefiereOscuro);
}

/**
 * La preferencia guardada, leída como lo que es: un almacén de fuera de React.
 *
 * Se lee con useSyncExternalStore y no copiándola a un estado al montar,
 * porque en el servidor no hay almacenamiento y copiarla encadenaría un render
 * de más en cada carga. El evento propio mantiene al día a cualquier otra
 * copia del control que esté montada.
 */
const EVENTO_TEMA = "aeuvg:tema-cambiado";

function suscribir(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_TEMA, alCambiar);
  // El evento `storage` llega cuando se cambia desde otra pestaña.
  window.addEventListener("storage", alCambiar);

  return () => {
    window.removeEventListener(EVENTO_TEMA, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function leerTema(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return esTema(guardado) ? guardado : "sistema";
  } catch {
    // Almacenamiento bloqueado: se queda con el del dispositivo.
    return "sistema";
  }
}

/** En el servidor no hay preferencia que leer. */
const temaEnServidor = (): Tema => "sistema";

/**
 * Elección del tema, desde el perfil.
 *
 * Es el único sitio desde donde se cambia. Un botón suelto en el encabezado o
 * en la portada compite con la navegación y se pulsa sin querer; aquí está
 * junto a las demás preferencias de la cuenta, que es donde se busca.
 *
 * Se aplica al elegir, sin botón de guardar: el efecto se ve de inmediato en
 * la propia pantalla y un paso más solo haría dudar de si quedó puesto.
 */
export function TemaPerfil() {
  const tema = useSyncExternalStore(suscribir, leerTema, temaEnServidor);

  // Con "el del dispositivo" hay que seguir al sistema mientras la pestaña
  // está abierta: si no, cambiar el modo del teléfono no se notaría.
  useEffect(() => {
    if (tema !== "sistema") return;

    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => aplicar("sistema");

    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, [tema]);

  function elegir(nuevo: Tema) {
    aplicar(nuevo);

    try {
      localStorage.setItem(CLAVE_TEMA, nuevo);
    } catch {
      // Sin almacenamiento el tema dura lo que dure la pestaña, y el control
      // vuelve a marcar el del dispositivo en la siguiente carga.
    }

    window.dispatchEvent(new Event(EVENTO_TEMA));
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-lg font-bold">Apariencia</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Cómo se ve la plataforma en este dispositivo. La elección se guarda solo aquí, así que
          puedes tenerla distinta en tu teléfono y en tu computadora.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TEMAS.map((opcion) => {
          const elegido = tema === opcion;

          return (
            <button
              key={opcion}
              type="button"
              onClick={() => elegir(opcion)}
              aria-pressed={elegido}
              className={`flex flex-col gap-2 rounded-[1.25rem] border p-4 text-left transition-colors ${
                elegido
                  ? "border-primario bg-primario-suave"
                  : "border-borde bg-superficie hover:bg-superficie-suave"
              }`}
            >
              {/* Una muestra del tema, para no tener que probarlo a ciegas. */}
              <span
                aria-hidden
                className={`flex h-10 w-full items-center gap-1.5 rounded-xl border px-2 ${
                  opcion === "oscuro"
                    ? "border-[#362e52] bg-[#1d1833]"
                    : opcion === "claro"
                      ? "border-[#ebe2d8] bg-[#fff8f3]"
                      : "border-borde bg-gradient-to-r from-[#fff8f3] to-[#1d1833]"
                }`}
              >
                <span className="bg-primario size-3 rounded-full" />
                <span
                  className={`h-1.5 flex-1 rounded-full ${
                    opcion === "oscuro" ? "bg-[#4a416b]" : "bg-[#e3d9cd]"
                  }`}
                />
              </span>

              <span className="text-texto text-sm font-bold">{ETIQUETAS_TEMA[opcion]}</span>
              <span className="text-texto-suave text-xs leading-relaxed">
                {DESCRIPCIONES_TEMA[opcion]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
