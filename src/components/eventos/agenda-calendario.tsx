import Link from "next/link";

import type { Calendario } from "@/lib/eventos/calendario";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";
import { formatearFechaLarga, formatearHora } from "@/lib/eventos/formato-fechas";
import { inicioDelDiaEnGuatemala } from "@/lib/eventos/filtros-eventos";
import { cn } from "@/lib/utils";

/**
 * Versión del calendario para teléfono.
 *
 * Siete columnas no caben en un ancho de teléfono sin volver ilegible cada
 * casilla, así que en pantallas pequeñas el periodo se presenta como una
 * agenda: los días que tienen actividades, uno debajo de otro. Se omiten los
 * días vacíos porque en esta vista no aportan estructura, solo desplazamiento.
 */
export function AgendaCalendario({
  calendario,
  eventosPorDia,
}: {
  calendario: Calendario;
  eventosPorDia: Map<string, EventoResumen[]>;
}) {
  const conEventos = calendario.dias.filter(
    (dia) => (eventosPorDia.get(dia.clave)?.length ?? 0) > 0
  );

  if (conEventos.length === 0) {
    return (
      <p className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
        No hay actividades programadas en este periodo.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {conEventos.map((dia) => (
        <li
          key={dia.clave}
          className="border-borde bg-superficie rounded-[1.25rem] border p-4 shadow-sm"
        >
          <p
            className={cn(
              "text-xs font-bold tracking-wide uppercase",
              dia.esHoy ? "text-primario" : "text-texto-suave"
            )}
          >
            {dia.esHoy ? "Hoy · " : ""}
            {formatearFechaLarga(inicioDelDiaEnGuatemala(dia.clave))}
          </p>

          <ul className="mt-3 flex flex-col gap-3">
            {(eventosPorDia.get(dia.clave) ?? []).map((evento) => (
              <li key={evento.idEvento}>
                <Link href={`/eventos/${evento.idEvento}`} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
                  />
                  <span className="min-w-0">
                    <span className="text-texto block text-sm font-bold break-words">
                      {evento.nombre}
                    </span>
                    <span className="text-texto-suave block text-xs">
                      {formatearHora(evento.fechaInicio)} · {evento.ubicacion}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
