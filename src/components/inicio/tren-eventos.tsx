"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImagenEvento } from "@/components/eventos/imagen-evento";
import { cn } from "@/lib/utils";

/** Datos de un vagón, ya formateados en el servidor. */
export type VagonTren = {
  idEvento: number;
  nombre: string;
  imagenUrl: string | null;
  dia: string;
  mes: string;
  hora: string;
  ubicacion: string;
  categoria: string;
  color: string;
  destacado: boolean;
};

/** Píxeles por segundo del avance automático: lento, para poder leer los vagones. */
const VELOCIDAD = 40;

/**
 * Vagones por cada mitad de la pista. Con pocos eventos se repiten hasta este
 * mínimo: si una mitad fuera más angosta que la pantalla, la vuelta al inicio
 * dejaría un hueco visible.
 */
const MINIMO_POR_MITAD = 8;

/** Separación entre vagones, en píxeles; coincide con gap-4. */
const SEPARACION = 16;

/** Tiempo que el avance automático espera después de que alguien desplaza la fila. */
const ESPERA_TRAS_INTERACCION = 2500;

function Vagon({ vagon, decorativo }: { vagon: VagonTren; decorativo: boolean }) {
  return (
    <li aria-hidden={decorativo || undefined} className="shrink-0">
      <Link
        href={`/eventos/${vagon.idEvento}`}
        // Las copias que solo completan la pista no se anuncian ni reciben foco:
        // cada evento se recorre una sola vez con el teclado.
        tabIndex={decorativo ? -1 : undefined}
        // data-vagon: las flechas avanzan exactamente un vagón.
        data-vagon
        className={cn(
          "group/vagon relative flex h-[22rem] w-[16.5rem] flex-col justify-end overflow-hidden rounded-[1.25rem] shadow-md sm:h-[24rem] sm:w-[19rem]",
          "focus-visible:ring-primario focus-visible:ring-4 focus-visible:outline-none"
        )}
      >
        <ImagenEvento
          imagenUrl={vagon.imagenUrl}
          nombre={vagon.nombre}
          color={vagon.color}
          sizes="320px"
          className="absolute inset-0 size-full transition-transform duration-500 group-hover/vagon:scale-105"
        />
        {/* El velo oscuro cubre sobre todo la parte baja: ahí va el texto, y el
            resto de la imagen se ve casi tal cual. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        />

        {/* Fecha en una ficha clara, legible sobre cualquier imagen. */}
        <div className="bg-superficie/95 text-texto absolute top-3 left-3 flex w-14 flex-col items-center rounded-xl py-1.5 shadow-sm">
          <span className="text-2xl leading-none font-extrabold">{vagon.dia}</span>
          <span className="mt-0.5 text-[0.65rem] font-bold tracking-widest uppercase">
            {vagon.mes}
          </span>
        </div>

        <div className="relative flex flex-col gap-2 p-5 text-white">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold"
              // El color proviene del catálogo de categorías cargado en la base.
              style={{ backgroundColor: vagon.color }}
            >
              {vagon.categoria}
            </span>
            {vagon.destacado && (
              <span className="bg-ambar text-texto rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold">
                ★ Destacado
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-xl leading-tight font-extrabold tracking-tight">
            {vagon.nombre}
          </p>
          <p className="truncate text-xs text-white/80">
            {vagon.hora} · {vagon.ubicacion}
          </p>
          <span className="text-texto mt-1 self-start rounded-full bg-white px-4 py-1.5 text-xs font-bold transition-transform group-hover/vagon:translate-x-1">
            Ver evento →
          </span>
        </div>
      </Link>
    </li>
  );
}

function Flecha({
  direccion,
  onClick,
}: {
  direccion: "anterior" | "siguiente";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direccion === "anterior" ? "Eventos anteriores" : "Eventos siguientes"}
      className={cn(
        "bg-superficie text-texto hover:text-primario absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full text-lg font-bold shadow-lg transition-colors md:grid",
        direccion === "anterior" ? "left-4" : "right-4"
      )}
    >
      <span aria-hidden>{direccion === "anterior" ? "←" : "→"}</span>
    </button>
  );
}

/**
 * Carrusel de próximos eventos de la portada, al que se le dice "el tren".
 *
 * Es una fila con desplazamiento horizontal real: avanza sola, se detiene
 * mientras el cursor o el foco del teclado están sobre ella, y también se mueve
 * con las flechas o deslizando el dedo. Para que nunca se acabe lleva dos
 * copias de los vagones; al recorrer la primera, el desplazamiento vuelve al
 * inicio sin que se note, porque la segunda ocupa exactamente el mismo lugar.
 *
 * El botón de pausa es el que exige la accesibilidad para contenido que se
 * mueve más de cinco segundos. Quien pidió al sistema reducir el movimiento
 * recibe la fila quieta, sin la copia, y la recorre a mano.
 */
export function TrenEventos({ vagones }: { vagones: VagonTren[] }) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);
  const [sobreLaFila, setSobreLaFila] = useState(false);
  const [movimientoReducido, setMovimientoReducido] = useState(false);
  // Hasta cuándo esperar después de que alguien desplazó la fila a mano.
  const esperarHasta = useRef(0);

  const detenido = pausado || sobreLaFila;

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizar = () => setMovimientoReducido(consulta.matches);
    actualizar();
    consulta.addEventListener("change", actualizar);
    return () => consulta.removeEventListener("change", actualizar);
  }, []);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista || detenido || movimientoReducido) return;

    // La posición se acumula aparte porque el navegador redondea scrollLeft a
    // píxeles enteros y, a esta velocidad, el avance de un cuadro es menor que
    // un píxel: sumándolo directamente, la fila no se movería.
    let posicion = pista.scrollLeft;
    let anterior = performance.now();
    let cuadro = requestAnimationFrame(function avanzar(ahora) {
      const transcurrido = Math.min(ahora - anterior, 100);
      anterior = ahora;

      if (ahora < esperarHasta.current) {
        posicion = pista.scrollLeft;
      } else {
        // Si alguien la movió a mano, el avance continúa desde donde quedó.
        if (Math.abs(pista.scrollLeft - posicion) > 2) posicion = pista.scrollLeft;
        posicion += (VELOCIDAD * transcurrido) / 1000;
        const mitad = pista.scrollWidth / 2;
        if (posicion >= mitad) posicion -= mitad;
        pista.scrollLeft = posicion;
      }

      cuadro = requestAnimationFrame(avanzar);
    });

    return () => cancelAnimationFrame(cuadro);
  }, [detenido, movimientoReducido]);

  const desplazar = useCallback(
    (sentido: 1 | -1) => {
      const pista = pistaRef.current;
      const vagon = pista?.querySelector<HTMLElement>("[data-vagon]");
      if (!pista || !vagon) return;

      const paso = vagon.offsetWidth + SEPARACION;
      const mitad = pista.scrollWidth / 2;

      // Con la copia presente, la fila da la vuelta en los dos sentidos: antes
      // de pasar del inicio o del final se salta, sin animación, al punto
      // equivalente de la otra copia.
      if (!movimientoReducido) {
        if (sentido === -1 && pista.scrollLeft < paso) pista.scrollLeft += mitad;
        if (sentido === 1 && pista.scrollLeft >= mitad) pista.scrollLeft -= mitad;
      }

      esperarHasta.current = performance.now() + ESPERA_TRAS_INTERACCION;
      pista.scrollBy({ left: sentido * paso, behavior: "smooth" });
    },
    [movimientoReducido]
  );

  if (vagones.length === 0) return null;

  const repeticiones = Math.ceil(MINIMO_POR_MITAD / vagones.length);
  const mitad = Array.from({ length: repeticiones }, (_, vuelta) =>
    vagones.map((vagon) => ({ vagon, decorativo: vuelta > 0 }))
  ).flat();

  return (
    <section aria-labelledby="titulo-tren">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <h2
          id="titulo-tren"
          className="text-texto-suave flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] uppercase sm:tracking-[0.2em]"
        >
          <span aria-hidden className="bg-coral size-2 rounded-full motion-safe:animate-pulse" />
          Próximamente en el campus
        </h2>
        {!movimientoReducido && (
          <button
            type="button"
            onClick={() => setPausado((actual) => !actual)}
            aria-pressed={pausado}
            className="border-borde text-texto-suave hover:text-texto shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors"
          >
            {pausado ? "▶ Reanudar" : "❚❚ Pausar"}
          </button>
        )}
      </div>

      <div
        className="relative mt-5"
        onPointerEnter={(evento) => {
          if (evento.pointerType === "mouse") setSobreLaFila(true);
        }}
        onPointerLeave={() => setSobreLaFila(false)}
        onFocus={() => setSobreLaFila(true)}
        onBlur={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget)) setSobreLaFila(false);
        }}
      >
        <Flecha direccion="anterior" onClick={() => desplazar(-1)} />
        <Flecha direccion="siguiente" onClick={() => desplazar(1)} />

        <div
          ref={pistaRef}
          // Al tocar la fila, el avance automático cede para no pelear con el dedo.
          onTouchStart={() => {
            esperarHasta.current = performance.now() + ESPERA_TRAS_INTERACCION;
          }}
          className={cn(
            "flex overflow-x-auto py-2",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Los extremos se desvanecen para que los vagones entren y salgan de
            // la pantalla en lugar de cortarse contra el borde.
            "[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
          )}
        >
          {/* Las dos mitades miden exactamente lo mismo (sin relleno inicial):
              es lo que permite volver al inicio sin salto. */}
          <ul className="flex shrink-0 gap-4 pr-4">
            {mitad.map(({ vagon, decorativo }, indice) => (
              <Vagon key={`a-${indice}`} vagon={vagon} decorativo={decorativo} />
            ))}
          </ul>
          {!movimientoReducido && (
            <ul aria-hidden className="flex shrink-0 gap-4 pr-4">
              {mitad.map(({ vagon }, indice) => (
                <Vagon key={`b-${indice}`} vagon={vagon} decorativo />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
