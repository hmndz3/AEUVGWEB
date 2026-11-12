"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { TutoriaVista } from "@/lib/tutorias/consultas-tutorias";
import {
  ETIQUETAS_ESTADO_TUTORIA,
  ETIQUETAS_MODALIDAD,
  formatearFechaTutoria,
} from "@/lib/tutorias/formato-tutorias";

const TONOS = {
  PROGRAMADA: "pendiente",
  COMPLETADA: "acreditada",
  CANCELADA: "error",
} as const;

const CONFIRMAR_CANCELAR =
  "La tutoría se cancela para los dos y no se puede volver a programar; habría que agendar otra. ¿Continuar?";

/**
 * Tutorías de la persona que mira, sea como estudiante o como tutor.
 *
 * Es la misma lista en los dos lados porque la información es la misma: qué
 * curso, cuándo, dónde y con quién. Lo único que cambia es a quién se nombra
 * —al tutor o al estudiante— y que completar solo lo ofrece el tutor, porque
 * es quien sabe si la sesión ocurrió.
 */
export function ListaTutorias({
  tutorias,
  comoTutor = false,
}: {
  tutorias: TutoriaVista[];
  comoTutor?: boolean;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolver(idTutoria: number, accion: "completar" | "cancelar") {
    if (accion === "cancelar" && !window.confirm(CONFIRMAR_CANCELAR)) return;

    setTrabajando(idTutoria);
    setError(null);

    try {
      const respuesta = await fetch(`/api/tutorias/${idTutoria}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo actualizar la tutoría.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  if (tutorias.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        {comoTutor
          ? "Todavía no te han solicitado ninguna tutoría. Publica tus horarios para que te encuentren."
          : "Todavía no has agendado ninguna tutoría."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tutorias.map((tutoria) => (
        <article
          key={tutoria.idTutoria}
          className="border-borde bg-superficie flex flex-wrap items-start justify-between gap-4 rounded-[1.25rem] border p-5"
        >
          <div className="min-w-0">
            <p className="text-texto font-bold">
              <span className="font-mono text-sm">{tutoria.curso.codigo}</span> ·{" "}
              {tutoria.curso.nombre}
            </p>
            <p className="text-texto-suave mt-1 text-sm first-letter:uppercase">
              {formatearFechaTutoria(tutoria.fechaInicio)}
            </p>
            <p className="text-texto-suave mt-0.5 text-sm">
              {comoTutor ? `Con ${tutoria.estudiante}` : `Con ${tutoria.tutor}`} ·{" "}
              {ETIQUETAS_MODALIDAD[tutoria.modalidad]}
              {tutoria.ubicacionEnlace ? ` · ${tutoria.ubicacionEnlace}` : ""}
            </p>
            {tutoria.observaciones && (
              <p className="text-texto-suave mt-2 text-sm leading-relaxed italic">
                “{tutoria.observaciones}”
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <EtiquetaEstado tono={TONOS[tutoria.estado]}>
              {ETIQUETAS_ESTADO_TUTORIA[tutoria.estado]}
            </EtiquetaEstado>

            {tutoria.estado === "PROGRAMADA" && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                {comoTutor && (
                  <button
                    type="button"
                    onClick={() => resolver(tutoria.idTutoria, "completar")}
                    disabled={trabajando !== null}
                    className="text-primario text-sm font-bold hover:underline disabled:opacity-50"
                  >
                    Marcar como dada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => resolver(tutoria.idTutoria, "cancelar")}
                  disabled={trabajando !== null}
                  className="text-error text-sm font-bold hover:underline disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </article>
      ))}

      {error && (
        <p role="alert" className="text-error text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
