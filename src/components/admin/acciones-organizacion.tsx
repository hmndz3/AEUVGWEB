"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

type Accion = "dar-de-baja" | "reactivar" | "eliminar";

const CONFIRMACIONES: Record<Accion, string> = {
  "dar-de-baja":
    "El registro dejará de aparecer en el sitio, pero conservará su historial de eventos. ¿Continuar?",
  reactivar: "El registro volverá a aparecer en el sitio. ¿Continuar?",
  eliminar: "El registro se borrará de forma permanente. ¿Continuar?",
};

/**
 * Acciones de una fila del listado del panel.
 *
 * Las tres cambian lo que ve el estudiantado, así que ninguna se ejecuta sin
 * confirmar. Tras aplicarlas se refresca la ruta para que la tabla muestre el
 * estado real y no una versión optimista.
 */
export function AccionesOrganizacion({
  tipo,
  id,
  activo,
  eventosOrganizados,
}: {
  tipo: TipoOrganizacion;
  id: number;
  activo: boolean;
  eventosOrganizados: number;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<Accion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El servicio ya rechaza la eliminación de un registro con eventos, pero
  // durante la revisión del sprint AEUVG señaló que el botón invitaba a
  // intentarlo para enterarse. Se deshabilita con la razón a la vista.
  const motivoNoEliminar =
    eventosOrganizados > 0
      ? `Organiza ${eventosOrganizados} ${eventosOrganizados === 1 ? "evento" : "eventos"}: dala de baja en lugar de eliminarla, para no borrar su historial.`
      : null;

  async function ejecutar(accion: Accion) {
    if (!window.confirm(CONFIRMACIONES[accion])) return;

    setTrabajando(accion);
    setError(null);

    try {
      const base = `/api/admin/organizaciones/${tipo}/${id}`;
      const respuesta = await fetch(accion === "eliminar" ? base : `${base}/estado`, {
        method: accion === "eliminar" ? "DELETE" : "PATCH",
        ...(accion === "eliminar"
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accion }),
            }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo completar la operación.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {activo ? (
          <Boton
            tamano="sm"
            variante="contorno"
            cargando={trabajando === "dar-de-baja"}
            onClick={() => ejecutar("dar-de-baja")}
          >
            Dar de baja
          </Boton>
        ) : (
          <Boton
            tamano="sm"
            cargando={trabajando === "reactivar"}
            onClick={() => ejecutar("reactivar")}
          >
            Reactivar
          </Boton>
        )}

        <Boton
          tamano="sm"
          variante="destructivo"
          cargando={trabajando === "eliminar"}
          disabled={motivoNoEliminar !== null}
          title={motivoNoEliminar ?? undefined}
          onClick={() => ejecutar("eliminar")}
        >
          Eliminar
        </Boton>
      </div>

      {motivoNoEliminar && !error && (
        <p className="text-texto-suave max-w-xs text-right text-xs">{motivoNoEliminar}</p>
      )}

      {error && (
        <p role="alert" className="text-error max-w-xs text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
