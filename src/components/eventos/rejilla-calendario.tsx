import Link from "next/link";

import type { Calendario } from "@/lib/eventos/calendario";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";
import { formatearHora } from "@/lib/eventos/formato-fechas";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Eventos que caben en una casilla del mes antes de resumir el resto. */
const VISIBLES_POR_DIA = 3;

function EventoDelDia({ evento, conHora }: { evento: EventoResumen; conHora: boolean }) {
  return (
    <Link
      href={`/eventos/${evento.idEvento}`}
      title={evento.nombre}
      className="hover:bg-superficie-suave block rounded-lg px-1.5 py-1 text-left text-xs transition-colors"
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
        />
        <span className="text-texto truncate font-semibold">{evento.nombre}</span>
      </span>
      {conHora && (
        <span className="text-texto-suave mt-0.5 block pl-3.5">
          {formatearHora(evento.fechaInicio)} · {evento.ubicacion}
        </span>
      )}
    </Link>
  );
}

/**
 * Rejilla del calendario. Recibe la grilla y los eventos ya agrupados por día,
 * de modo que toda la aritmética de fechas quede en
 * src/lib/eventos/calendario.ts y este componente solo se ocupe de dibujarla.
 */
export function RejillaCalendario({
  calendario,
  eventosPorDia,
}: {
  calendario: Calendario;
  eventosPorDia: Map<string, EventoResumen[]>;
}) {
  const esSemana = calendario.vista === "semana";

  return (
    <div className="border-borde bg-superficie overflow-hidden rounded-[1.25rem] border">
      <div className="border-borde bg-superficie-suave grid grid-cols-7 border-b">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-texto-suave px-2 py-3 text-center text-xs font-bold tracking-wide uppercase"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendario.dias.map((dia) => {
          const eventos = eventosPorDia.get(dia.clave) ?? [];
          const visibles = esSemana ? eventos : eventos.slice(0, VISIBLES_POR_DIA);
          const ocultos = eventos.length - visibles.length;

          return (
            <div
              key={dia.clave}
              className={cn(
                "border-borde min-h-28 border-r border-b p-2 last:border-r-0",
                !dia.delPeriodo && "bg-superficie-suave/60",
                esSemana && "min-h-56"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  dia.esHoy && "bg-primario text-white",
                  !dia.esHoy && dia.delPeriodo && "text-texto",
                  !dia.esHoy && !dia.delPeriodo && "text-texto-suave"
                )}
              >
                {dia.numero}
              </span>

              <div className="mt-1 flex flex-col gap-0.5">
                {visibles.map((evento) => (
                  <EventoDelDia key={evento.idEvento} evento={evento} conHora={esSemana} />
                ))}

                {ocultos > 0 && (
                  <Link
                    href={`/eventos?desde=${dia.clave}&hasta=${dia.clave}`}
                    className="text-primario px-1.5 text-xs font-bold hover:underline"
                  >
                    +{ocultos} más
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
