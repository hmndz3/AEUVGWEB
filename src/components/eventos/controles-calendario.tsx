import Link from "next/link";

import {
  periodoAnterior,
  periodoSiguiente,
  VISTAS,
  type Calendario,
  type VistaCalendario,
} from "@/lib/eventos/calendario";
import { cn } from "@/lib/utils";

const NOMBRE_VISTA: Record<VistaCalendario, string> = { mes: "Mes", semana: "Semana" };

function enlace(vista: VistaCalendario, ancla: string): string {
  return `/calendario?vista=${vista}&fecha=${ancla}`;
}

const claseNavegacion =
  "border-borde bg-superficie text-texto hover:bg-superficie-suave inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors";

/**
 * Navegación del calendario. El periodo y la vista viajan en la dirección en
 * lugar de guardarse en el navegador: así el enlace de una semana concreta
 * puede compartirse y la página la sigue generando el servidor.
 */
export function ControlesCalendario({
  calendario,
  claveHoy,
}: {
  calendario: Calendario;
  claveHoy: string;
}) {
  const { vista, ancla, titulo } = calendario;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={enlace(vista, periodoAnterior(vista, ancla))}
            aria-label={vista === "mes" ? "Mes anterior" : "Semana anterior"}
            className={claseNavegacion}
          >
            ←
          </Link>
          <Link
            href={enlace(vista, periodoSiguiente(vista, ancla))}
            aria-label={vista === "mes" ? "Mes siguiente" : "Semana siguiente"}
            className={claseNavegacion}
          >
            →
          </Link>
          <Link href={enlace(vista, claveHoy)} className={claseNavegacion}>
            Hoy
          </Link>
        </div>

        <h2 className="text-texto text-xl font-bold">{titulo}</h2>
      </div>

      <div
        role="group"
        aria-label="Vista del calendario"
        className="border-borde bg-superficie inline-flex rounded-full border p-1"
      >
        {VISTAS.map((opcion) => (
          <Link
            key={opcion}
            href={enlace(opcion, ancla)}
            aria-current={vista === opcion ? "true" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              vista === opcion
                ? "bg-primario text-white"
                : "text-texto-suave hover:bg-superficie-suave"
            )}
          >
            {NOMBRE_VISTA[opcion]}
          </Link>
        ))}
      </div>
    </div>
  );
}
