import { BotonGuardarEvento } from "@/components/eventos/boton-guardar-evento";
import { TarjetaEvento } from "@/components/eventos/tarjeta-evento";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";

/**
 * Rejilla de eventos: tres columnas en escritorio, una en teléfono.
 *
 * El control de guardar se muestra solo cuando la pantalla lo pide con
 * `guardables`. Las pantallas que no lo necesitan, como la portada, no pagan la
 * consulta de los eventos guardados del estudiante.
 */
export function ListaEventos({
  eventos,
  ahora,
  guardables = false,
  conSesion = false,
  guardados,
}: {
  eventos: EventoResumen[];
  ahora?: Date;
  guardables?: boolean;
  conSesion?: boolean;
  guardados?: Set<number>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((evento) => (
        <TarjetaEvento
          key={evento.idEvento}
          evento={evento}
          ahora={ahora}
          accion={
            guardables ? (
              <BotonGuardarEvento
                idEvento={evento.idEvento}
                guardado={guardados?.has(evento.idEvento) ?? false}
                conSesion={conSesion}
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
