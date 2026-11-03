"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ETIQUETAS_ACCION_OPORTUNIDAD,
  type AccionOportunidad,
  type EstadoOportunidadFiltro,
} from "@/validators/oportunidad-admin";

/**
 * Acciones que tiene sentido ofrecer según el estado.
 *
 * Un borrador se publica o se descarta; una publicada se cierra cuando ya no
 * admite gente; una cerrada se marca como finalizada cuando la actividad pasó.
 * Cancelada y finalizada no ofrecen nada: son el final del recorrido.
 */
const ACCIONES_POR_ESTADO: Record<EstadoOportunidadFiltro, AccionOportunidad[]> = {
  BORRADOR: ["publicar", "cancelar"],
  PUBLICADA: ["cerrar", "cancelar"],
  CERRADA: ["finalizar", "cancelar"],
  CANCELADA: [],
  FINALIZADA: [],
};

const CONFIRMACIONES: Partial<Record<AccionOportunidad, string>> = {
  cancelar:
    "La convocatoria dejará de verse en el sitio y ya no podrá cambiar de estado. ¿Continuar?",
  finalizar: "La convocatoria quedará como realizada y ya no podrá cambiar de estado. ¿Continuar?",
};

const CONFIRMACION_ELIMINAR =
  "La convocatoria se borrará de forma permanente. Si ya tiene horas registradas, cancélala en lugar de eliminarla. ¿Continuar?";

/**
 * Acciones de una convocatoria desde su fila del listado.
 *
 * El cambio de estado y la eliminación van por rutas distintas porque son
 * operaciones distintas: la primera deja historial y la segunda no. La
 * eliminación la rechaza el servidor cuando hay horas asociadas, y ese mensaje
 * es el que se presenta aquí en lugar de esconderla.
 */
export function AccionesOportunidad({
  id,
  nombre,
  estado,
  registros,
}: {
  id: number;
  nombre: string;
  estado: EstadoOportunidadFiltro;
  registros: number;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enviar(etiqueta: string, peticion: () => Promise<Response>) {
    setTrabajando(etiqueta);
    setError(null);

    try {
      const respuesta = await peticion();

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo aplicar la acción.");
        return;
      }

      // Se refresca la ruta para que los contadores por estado, que calcula el
      // servidor, no queden desfasados con la fila que acaba de cambiar.
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  function cambiarEstado(accion: AccionOportunidad) {
    const confirmacion = CONFIRMACIONES[accion];
    if (confirmacion && !window.confirm(confirmacion)) return;

    return enviar(accion, () =>
      fetch(`/api/admin/horas-beca/oportunidades/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      })
    );
  }

  function eliminar() {
    if (!window.confirm(CONFIRMACION_ELIMINAR)) return;

    return enviar("eliminar", () =>
      fetch(`/api/admin/horas-beca/oportunidades/${id}`, { method: "DELETE" })
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {ACCIONES_POR_ESTADO[estado].map((accion) => (
          <button
            key={accion}
            type="button"
            onClick={() => cambiarEstado(accion)}
            disabled={trabajando !== null}
            aria-label={`${ETIQUETAS_ACCION_OPORTUNIDAD[accion]} la convocatoria ${nombre}`}
            className="text-primario text-sm font-bold hover:underline disabled:opacity-50"
          >
            {trabajando === accion ? "Aplicando…" : ETIQUETAS_ACCION_OPORTUNIDAD[accion]}
          </button>
        ))}

        {/* Sin horas asociadas todavía se puede borrar; con horas, el servidor
            la rechaza y el panel explica que hay que cancelarla. */}
        {registros === 0 && (
          <button
            type="button"
            onClick={eliminar}
            disabled={trabajando !== null}
            aria-label={`Eliminar la convocatoria ${nombre}`}
            className="text-error text-sm font-bold hover:underline disabled:opacity-50"
          >
            {trabajando === "eliminar" ? "Eliminando…" : "Eliminar"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-error max-w-xs text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
