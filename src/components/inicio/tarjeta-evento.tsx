import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { EventoResumen } from "@/lib/inicio/consultas-inicio";

const formatoFecha = new Intl.DateTimeFormat("es-GT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const formatoHora = new Intl.DateTimeFormat("es-GT", { hour: "2-digit", minute: "2-digit" });

export function TarjetaEvento({ evento }: { evento: EventoResumen }) {
  return (
    <article className="border-borde bg-superficie flex flex-col rounded-[1.25rem] border p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          // El color proviene del catálogo de categorías cargado en la base.
          style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
        >
          {evento.categoria.nombre}
        </span>
        {evento.destacado && <EtiquetaEstado tono="informativo">Destacado</EtiquetaEstado>}
      </div>

      <h3 className="text-texto mt-4 text-lg font-bold">{evento.nombre}</h3>

      <dl className="text-texto-suave mt-3 flex flex-col gap-1 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Fecha</dt>
          <dd>
            {formatoFecha.format(evento.fechaInicio)} · {formatoHora.format(evento.fechaInicio)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Ubicación</dt>
          <dd>{evento.ubicacion}</dd>
        </div>
      </dl>

      {evento.organizadores.length > 0 && (
        <p className="border-borde text-texto-suave mt-4 border-t pt-3 text-xs">
          <span className="font-bold uppercase">Organiza</span> · {evento.organizadores.join(", ")}
        </p>
      )}
    </article>
  );
}
