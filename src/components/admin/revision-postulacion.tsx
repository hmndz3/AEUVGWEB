"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";

/**
 * Revisión de una postulación para ser tutor.
 *
 * Aprobar y rechazar comparten el comentario, que es lo que el estudiante va a
 * leer: en un rechazo explica qué faltó y en una aprobación puede indicar una
 * condición. El de rechazo se pide antes de aplicar, porque un rechazo sin
 * motivo obliga a la persona a adivinar.
 */
export function RevisionPostulacion({
  idPostulacion,
  nombre,
}: {
  idPostulacion: number;
  nombre: string;
}) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolver(decision: "aprobar" | "rechazar") {
    if (decision === "rechazar" && comentario.trim().length === 0) {
      setError("Escribe por qué se rechaza: es lo que el estudiante va a leer.");
      return;
    }

    setTrabajando(decision);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/tutorias/postulaciones/${idPostulacion}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comentarioRevision: comentario }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo resolver la postulación.");
        return;
      }

      // Se refresca la ruta porque los contadores por estado y el listado de
      // tutores los calcula el servidor y quedarían desfasados.
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className="border-borde mt-4 flex flex-col gap-3 border-t pt-4">
      <label htmlFor={`comentario-${idPostulacion}`} className="text-texto text-sm font-semibold">
        Comentario para {nombre}
      </label>
      <textarea
        id={`comentario-${idPostulacion}`}
        value={comentario}
        onChange={(evento) => setComentario(evento.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Obligatorio si la rechazas."
        className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Boton
          type="button"
          tamano="sm"
          cargando={trabajando === "aprobar"}
          disabled={trabajando !== null}
          onClick={() => resolver("aprobar")}
        >
          Aprobar
        </Boton>
        <Boton
          type="button"
          variante="contorno"
          tamano="sm"
          cargando={trabajando === "rechazar"}
          disabled={trabajando !== null}
          onClick={() => resolver("rechazar")}
        >
          Rechazar
        </Boton>
      </div>

      {error && (
        <p role="alert" className="text-error text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
