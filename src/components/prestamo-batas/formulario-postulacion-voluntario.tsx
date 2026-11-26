"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { RejillaTurnos } from "@/components/prestamo-batas/rejilla-turnos";
import type { TurnoSelector } from "@/lib/prestamo-batas/consultas-prestamo-batas";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Postulación para ser voluntario del salón.
 *
 * El estudiante marca los turnos a los que puede atender; los que ya tienen sus
 * dos voluntarios se muestran pero no se pueden elegir. AEUVG revisa después la
 * postulación y asigna al estudiante a los turnos que correspondan.
 */
export function FormularioPostulacionVoluntario({ turnos }: { turnos: TurnoSelector[] }) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  function alternar(idTurno: number) {
    setSeleccion((previo) => {
      const copia = new Set(previo);
      if (copia.has(idTurno)) copia.delete(idTurno);
      else copia.add(idTurno);
      return copia;
    });
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (seleccion.size === 0) {
      setError("Elige al menos un turno al que puedas atender.");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch("/api/prestamo-batas/postulaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idsTurnos: [...seleccion],
          comentarioSolicitante: comentario,
        }),
      });

      if (respuesta.ok) {
        setExito(true);
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(cuerpo.errores ?? {})[0] ??
          cuerpo.mensaje ??
          "No se pudo enviar la postulación."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <Alerta tipo="exito" titulo="Postulación enviada">
        AEUVG revisará tu postulación y te avisará cuando te asigne a tus turnos.
      </Alerta>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <NotaCamposObligatorios />

      {error && <Alerta tipo="error">{error}</Alerta>}

      <fieldset className="flex flex-col gap-4">
        <legend className="text-texto text-sm font-semibold">
          Turnos a los que puedo atender
          <span aria-hidden className="text-error ml-0.5 font-bold">
            *
          </span>
        </legend>

        <RejillaTurnos
          turnos={turnos}
          vacio="Todavía no hay turnos abiertos a postulación."
          casilla={(turno) => {
            const marcado = seleccion.has(turno.idTurno);

            return (
              <label
                className={`flex h-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                  turno.libre
                    ? marcado
                      ? "bg-primario-suave text-sobre-primario-suave ring-primario cursor-pointer ring-2"
                      : "bg-superficie-suave text-texto hover:bg-primario-suave/60 cursor-pointer"
                    : "bg-superficie-suave text-texto-suave cursor-not-allowed opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!turno.libre}
                  checked={marcado}
                  onChange={() => alternar(turno.idTurno)}
                  className="accent-primario size-4 shrink-0"
                />
                <span className="font-semibold">
                  {turno.libre ? "Puedo atender" : "Turno lleno"}
                </span>
                <span className="sr-only">
                  {turno.etiquetaDia}, {turno.rango}
                </span>
              </label>
            );
          }}
          casillaVacia={() => (
            <div className="flex h-full min-h-10 items-center justify-center">
              <span aria-hidden className="text-texto-suave text-xs opacity-40">
                —
              </span>
            </div>
          )}
        />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="comentario">Comentario (opcional)</EtiquetaCampo>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Cuéntale a AEUVG algo que deba saber sobre tu disponibilidad."
          className={claseCampo}
        />
      </div>

      <div>
        <Boton type="submit" cargando={enviando}>
          Enviar postulación
        </Boton>
      </div>
    </form>
  );
}
