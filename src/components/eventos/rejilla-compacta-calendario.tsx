import type { Calendario } from "@/lib/eventos/calendario";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";
import { cn } from "@/lib/utils";

/** Inicial de cada día; en un ancho de teléfono no cabe más. */
const INICIALES = ["D", "L", "M", "M", "J", "V", "S"];

/** Puntos que caben debajo del número sin apretar la casilla. */
const PUNTOS_VISIBLES = 3;

/**
 * Calendario del mes para teléfono.
 *
 * La rejilla de escritorio no cabe aquí —siete columnas con el nombre de cada
 * actividad dejan una tipografía ilegible—, pero sin ninguna rejilla la página
 * del calendario dejaba de parecer un calendario en el teléfono: solo se veía
 * la lista de días con actividades. Esta versión conserva la forma del mes y
 * marca con un punto de color cada actividad del día; al tocar un día con
 * actividades se baja a ese día en la agenda, que es donde se leen.
 */
export function RejillaCompactaCalendario({
  calendario,
  eventosPorDia,
}: {
  calendario: Calendario;
  eventosPorDia: Map<string, EventoResumen[]>;
}) {
  return (
    <div className="border-borde bg-superficie overflow-hidden rounded-[1.25rem] border">
      <div className="border-borde bg-superficie-suave grid grid-cols-7 border-b">
        {INICIALES.map((inicial, indice) => (
          <span
            key={indice}
            aria-hidden
            className="text-texto-suave py-2 text-center text-[0.7rem] font-bold"
          >
            {inicial}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendario.dias.map((dia) => {
          const eventos = eventosPorDia.get(dia.clave) ?? [];
          const puntos = eventos.slice(0, PUNTOS_VISIBLES);

          const casilla = (
            <>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm",
                  dia.esHoy && "bg-primario font-bold text-white",
                  !dia.esHoy && dia.delPeriodo && "text-texto font-semibold",
                  !dia.esHoy && !dia.delPeriodo && "text-texto-suave"
                )}
              >
                {dia.numero}
              </span>

              {/* La altura se reserva siempre, con o sin puntos, para que las
                  semanas no queden de alturas distintas. */}
              <span className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                {puntos.map((evento) => (
                  <span
                    key={evento.idEvento}
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
                  />
                ))}
              </span>
            </>
          );

          const clases = "flex flex-col items-center py-1.5";

          // Un día sin actividades no es un enlace: no tiene a dónde llevar.
          return eventos.length > 0 ? (
            <a
              key={dia.clave}
              href={`#dia-${dia.clave}`}
              aria-label={`${eventos.length} ${eventos.length === 1 ? "actividad" : "actividades"} el ${dia.numero}`}
              className={`${clases} hover:bg-superficie-suave rounded-xl transition-colors`}
            >
              {casilla}
            </a>
          ) : (
            <span key={dia.clave} className={clases}>
              {casilla}
            </span>
          );
        })}
      </div>
    </div>
  );
}
