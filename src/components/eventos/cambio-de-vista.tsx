import Link from "next/link";

import { cn } from "@/lib/utils";

const OPCIONES = [
  { href: "/eventos", texto: "Lista" },
  { href: "/calendario", texto: "Calendario" },
] as const;

/**
 * Alterna entre la cartelera y el calendario. Son dos formas de leer la misma
 * información, así que el cambio vive en las dos pantallas y no en el menú.
 */
export function CambioDeVista({ activa }: { activa: "/eventos" | "/calendario" }) {
  return (
    <div
      role="group"
      aria-label="Forma de ver los eventos"
      className="border-borde bg-superficie inline-flex rounded-full border p-1"
    >
      {OPCIONES.map((opcion) => (
        <Link
          key={opcion.href}
          href={opcion.href}
          aria-current={activa === opcion.href ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activa === opcion.href
              ? "bg-primario text-white"
              : "text-texto-suave hover:bg-superficie-suave"
          )}
        >
          {opcion.texto}
        </Link>
      ))}
    </div>
  );
}
