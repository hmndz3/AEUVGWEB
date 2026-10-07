"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Control de guardar un evento en el perfil.
 *
 * Sin sesión no se oculta: navega al inicio de sesión llevando la pantalla
 * actual en el parámetro de continuación, de modo que al volver el estudiante
 * quede donde estaba y no en la portada. Ocultarlo dejaría la función invisible
 * justo para quien todavía no tiene cuenta.
 */
export function BotonGuardarEvento({
  idEvento,
  guardado: guardadoInicial,
  conSesion,
  presentacion = "icono",
  className,
}: {
  idEvento: number;
  guardado: boolean;
  conSesion: boolean;
  /** "icono" para la tarjeta del listado, "boton" para el detalle del evento. */
  presentacion?: "icono" | "boton";
  className?: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const [guardado, setGuardado] = useState(guardadoInicial);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etiqueta = guardado ? "Quitar de mis eventos guardados" : "Guardar este evento";

  async function alternar() {
    if (!conSesion) {
      const consulta = parametros.toString();
      const destino = consulta ? `${ruta}?${consulta}` : ruta;
      router.push(`/iniciar-sesion?continuar=${encodeURIComponent(destino)}`);
      return;
    }

    setTrabajando(true);
    setError(null);

    // El cambio se pinta de inmediato y se revierte si el servidor lo rechaza:
    // el control está dentro de una tarjeta y esperar la respuesta deja la
    // impresión de que no respondió.
    const siguiente = !guardado;
    setGuardado(siguiente);

    try {
      const respuesta = await fetch(`/api/eventos/${idEvento}/guardar`, {
        method: siguiente ? "POST" : "DELETE",
      });

      if (!respuesta.ok) {
        setGuardado(!siguiente);
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo guardar el evento.");
        return;
      }

      router.refresh();
    } catch {
      setGuardado(!siguiente);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setTrabajando(false);
    }
  }

  if (presentacion === "boton") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <button
          type="button"
          onClick={alternar}
          disabled={trabajando}
          aria-pressed={conSesion ? guardado : undefined}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors",
            "focus-visible:ring-primario focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-50",
            guardado
              ? "bg-primario-suave text-primario-fuerte"
              : "border-borde bg-superficie text-texto hover:bg-superficie-suave border"
          )}
        >
          <span aria-hidden>{guardado ? "★" : "☆"}</span>
          {guardado ? "Guardado" : "Guardar evento"}
        </button>
        {error && (
          <p role="alert" className="text-error text-xs">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={trabajando}
      aria-label={etiqueta}
      title={error ?? etiqueta}
      aria-pressed={conSesion ? guardado : undefined}
      className={cn(
        "grid size-9 place-items-center rounded-full shadow-sm transition-colors",
        "focus-visible:ring-primario focus-visible:ring-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        guardado ? "bg-primario text-white" : "bg-superficie/90 text-texto hover:bg-superficie",
        error && "ring-error ring-2",
        className
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {guardado ? "★" : "☆"}
      </span>
    </button>
  );
}
