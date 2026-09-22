"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";

type Accion = "publicar" | "cancelar" | "eliminar";

const CONFIRMACIONES: Record<Accion, string> = {
  publicar: "El evento quedará visible para todo el estudiantado. ¿Continuar?",
  cancelar: "El evento dejará de aparecer en el listado y en el calendario. ¿Continuar?",
  eliminar: "El evento se borrará de forma permanente. ¿Continuar?",
};

/**
 * Acciones de una fila del listado administrativo.
 *
 * Las tres operaciones cambian lo que ve el estudiantado, así que ninguna se
 * ejecuta sin confirmar. Tras aplicarlas se refresca la ruta para que la tabla
 * muestre el estado real y no una versión optimista.
 */
export function AccionesEvento({
  idEvento,
  estado,
}: {
  idEvento: number;
  estado: "BORRADOR" | "PUBLICADO" | "CANCELADO" | "FINALIZADO";
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<Accion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: Accion) {
    if (!window.confirm(CONFIRMACIONES[accion])) return;

    setTrabajando(accion);
    setError(null);

    try {
      const respuesta = await fetch(
        accion === "eliminar"
          ? `/api/admin/eventos/${idEvento}`
          : `/api/admin/eventos/${idEvento}/estado`,
        accion === "eliminar"
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accion }),
            }
      );

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
        {estado !== "PUBLICADO" && estado !== "FINALIZADO" && (
          <Boton
            tamano="sm"
            cargando={trabajando === "publicar"}
            onClick={() => ejecutar("publicar")}
          >
            Publicar
          </Boton>
        )}

        {estado !== "CANCELADO" && estado !== "FINALIZADO" && (
          <Boton
            tamano="sm"
            variante="contorno"
            cargando={trabajando === "cancelar"}
            onClick={() => ejecutar("cancelar")}
          >
            Cancelar
          </Boton>
        )}

        <Boton
          tamano="sm"
          variante="destructivo"
          cargando={trabajando === "eliminar"}
          onClick={() => ejecutar("eliminar")}
        >
          Eliminar
        </Boton>
      </div>

      {error && (
        <p role="alert" className="text-error max-w-xs text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
