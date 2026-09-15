import Link from "next/link";

import { ImagenEvento } from "@/components/eventos/imagen-evento";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";
import { estadoVisible, etiquetaEstado, tonoEstado } from "@/lib/eventos/estado-evento";
import { formatearFechaLarga, formatearHora } from "@/lib/eventos/formato-fechas";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de un evento. Es el mismo componente en la portada, en el listado y
 * en los resultados de una búsqueda, para que un evento se vea igual en todo
 * el sitio.
 */
export function TarjetaEvento({
  evento,
  ahora,
  className,
}: {
  evento: EventoResumen;
  ahora?: Date;
  className?: string;
}) {
  const estado = estadoVisible(evento, ahora);

  return (
    <article className={cn("h-full", className)}>
      <Link
        href={`/eventos/${evento.idEvento}`}
        className={cn(
          "border-borde bg-superficie flex h-full flex-col overflow-hidden rounded-[1.25rem] border shadow-sm",
          "focus-visible:ring-primario transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
        )}
      >
        <ImagenEvento
          imagenUrl={evento.imagenUrl}
          nombre={evento.nombre}
          color={evento.categoria.color}
          className="h-40 w-full"
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-start gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              // El color proviene del catálogo de categorías cargado en la base.
              style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
            >
              {evento.categoria.nombre}
            </span>
            {evento.destacado && <EtiquetaEstado tono="informativo">Destacado</EtiquetaEstado>}
            {estado !== "proximo" && (
              <EtiquetaEstado tono={tonoEstado(estado)}>{etiquetaEstado(estado)}</EtiquetaEstado>
            )}
          </div>

          <h3 className="text-texto mt-3 text-lg leading-snug font-bold break-words">
            {evento.nombre}
          </h3>

          <dl className="text-texto-suave mt-3 flex flex-col gap-1 text-sm">
            <div>
              <dt className="sr-only">Fecha</dt>
              <dd>
                {formatearFechaLarga(evento.fechaInicio)} · {formatearHora(evento.fechaInicio)}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Ubicación</dt>
              <dd className="break-words">{evento.ubicacion}</dd>
            </div>
          </dl>

          {evento.organizadores.length > 0 && (
            <p className="border-borde text-texto-suave mt-auto border-t pt-3 text-xs">
              <span className="font-bold uppercase">Organiza</span> ·{" "}
              {evento.organizadores.join(", ")}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
