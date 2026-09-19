import type { Calendario } from "@/lib/eventos/calendario";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Rejilla del calendario. Recibe la grilla ya construida, de modo que toda la
 * aritmética de fechas quede en src/lib/eventos/calendario.ts y este
 * componente solo se ocupe de dibujarla.
 */
export function RejillaCalendario({ calendario }: { calendario: Calendario }) {
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
        {calendario.dias.map((dia) => (
          <div
            key={dia.clave}
            className={cn(
              "border-borde min-h-28 border-r border-b p-2 last:border-r-0",
              !dia.delPeriodo && "bg-superficie-suave/60",
              calendario.vista === "semana" && "min-h-56"
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
          </div>
        ))}
      </div>
    </div>
  );
}
