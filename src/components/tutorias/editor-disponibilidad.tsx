"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import { SelectorHora } from "@/components/ui/selector-hora";
import type { DisponibilidadTutorVista } from "@/lib/tutorias/consultas-tutorias";
import {
  DIAS_SEMANA,
  ETIQUETAS_DIA,
  ETIQUETAS_MODALIDAD,
  MODALIDADES,
  formatearRangoHoras,
} from "@/lib/tutorias/formato-tutorias";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Franjas de disponibilidad del tutor.
 *
 * Se publica por día de la semana y no por fecha porque la disponibilidad se
 * repite: un tutor que puede los martes de dos a cuatro lo puede todos los
 * martes del ciclo, y pedirle que marque fecha por fecha convertiría esto en
 * un trabajo semanal.
 *
 * El lugar o el enlace son obligatorios: son el dato que el estudiante
 * necesita para presentarse, y sin ellos la franja no sirve de nada.
 */
export function EditorDisponibilidad({ franjas }: { franjas: DisponibilidadTutorVista[] }) {
  const router = useRouter();
  const [diaSemana, setDiaSemana] = useState<string>(DIAS_SEMANA[0]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [modalidad, setModalidad] = useState<string>(MODALIDADES[0]);
  const [ubicacionEnlace, setUbicacionEnlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/tutorias/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diaSemana, horaInicio, horaFin, modalidad, ubicacionEnlace }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as {
          errores?: Record<string, string>;
          mensaje?: string;
        };
        setError(
          cuerpo.errores?.general ??
            Object.values(cuerpo.errores ?? {})[0] ??
            cuerpo.mensaje ??
            "No se pudo agregar la franja."
        );
        return;
      }

      setHoraInicio("");
      setHoraFin("");
      setUbicacionEnlace("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  async function quitar(idDisponibilidad: number) {
    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/tutorias/disponibilidad/${idDisponibilidad}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo quitar la franja.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {franjas.length === 0 ? (
        <p className="text-texto-suave text-sm leading-relaxed">
          Todavía no publicaste horarios. Mientras no lo hagas, nadie puede agendarte una tutoría.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {franjas.map((franja) => (
            <li
              key={franja.idDisponibilidad}
              className="border-borde bg-superficie flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-texto text-sm font-semibold">
                  {ETIQUETAS_DIA[franja.diaSemana]} de{" "}
                  {formatearRangoHoras(franja.horaInicio, franja.horaFin)}
                </p>
                <p className="text-texto-suave text-xs">
                  {ETIQUETAS_MODALIDAD[franja.modalidad]}
                  {franja.ubicacionEnlace ? ` · ${franja.ubicacionEnlace}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => quitar(franja.idDisponibilidad)}
                disabled={trabajando}
                className="text-error text-sm font-bold hover:underline disabled:opacity-50"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <Alerta tipo="error">{error}</Alerta>}

      <form
        onSubmit={agregar}
        noValidate
        className="border-borde bg-superficie-suave grid gap-4 rounded-[1.25rem] border p-4 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="diaSemana" obligatorio>
            Día
          </EtiquetaCampo>
          <select
            id="diaSemana"
            value={diaSemana}
            onChange={(evento) => setDiaSemana(evento.target.value)}
            className={claseCampo}
          >
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {ETIQUETAS_DIA[dia]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="modalidad" obligatorio>
            Modalidad
          </EtiquetaCampo>
          <select
            id="modalidad"
            value={modalidad}
            onChange={(evento) => setModalidad(evento.target.value)}
            className={claseCampo}
          >
            {MODALIDADES.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_MODALIDAD[valor]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <EtiquetaCampo htmlFor="horaInicio" obligatorio>
              De
            </EtiquetaCampo>
            <SelectorHora
              id="horaInicio"
              valor={horaInicio}
              onCambiar={setHoraInicio}
              paso={30}
              placeholder="Desde"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <EtiquetaCampo htmlFor="horaFin" obligatorio>
              A
            </EtiquetaCampo>
            <SelectorHora
              id="horaFin"
              valor={horaFin}
              onCambiar={setHoraFin}
              minimo={horaInicio || undefined}
              paso={30}
              placeholder="Hasta"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="ubicacionEnlace" obligatorio>
            Lugar o enlace
          </EtiquetaCampo>
          <input
            id="ubicacionEnlace"
            value={ubicacionEnlace}
            onChange={(evento) => setUbicacionEnlace(evento.target.value)}
            maxLength={500}
            placeholder="Biblioteca, segundo nivel · o el enlace de la reunión"
            className={claseCampo}
          />
        </div>

        <div className="sm:col-span-2">
          <Boton
            type="submit"
            variante="contorno"
            disabled={!horaInicio || !horaFin || !ubicacionEnlace}
            cargando={trabajando}
          >
            Agregar franja
          </Boton>
        </div>
      </form>
    </div>
  );
}
