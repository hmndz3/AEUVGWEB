import { TarjetaEvento } from "@/components/eventos/tarjeta-evento";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";

/** Rejilla de eventos: tres columnas en escritorio, una en teléfono. */
export function ListaEventos({ eventos, ahora }: { eventos: EventoResumen[]; ahora?: Date }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((evento) => (
        <TarjetaEvento key={evento.idEvento} evento={evento} ahora={ahora} />
      ))}
    </div>
  );
}
