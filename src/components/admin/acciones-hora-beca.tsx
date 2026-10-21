"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CONFIRMACION =
  "El registro se borrará de forma permanente y dejará de contar en las horas del estudiante. ¿Continuar?";

/**
 * Eliminación de un registro de horas desde su fila.
 *
 * A diferencia de las organizaciones, aquí no hay baja lógica: una fila mal
 * capturada no tiene historial que conservar y dejarla oculta descuadraría los
 * totales del estudiante. Por eso la confirmación dice en qué consiste la
 * operación en lugar de preguntar si se está seguro.
 */
export function AccionesHoraBeca({ id, carnet }: { id: number; carnet: string }) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    if (!window.confirm(CONFIRMACION)) return;

    setEliminando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/horas-beca/${id}`, { method: "DELETE" });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo eliminar el registro.");
        return;
      }

      // Se refresca la ruta en lugar de quitar la fila en el cliente: los
      // totales del periodo los calcula el servidor y quedarían desfasados.
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={eliminar}
        disabled={eliminando}
        aria-label={`Eliminar el registro de horas del carnet ${carnet}`}
        className="text-error text-sm font-bold hover:underline disabled:opacity-50"
      >
        {eliminando ? "Eliminando…" : "Eliminar"}
      </button>

      {error && (
        <p role="alert" className="text-error max-w-xs text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
