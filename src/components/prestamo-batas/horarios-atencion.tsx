import type { DiaConTurnos } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/**
 * Horarios en los que el salón está abierto, con quién atiende cada turno.
 * Es la tabla que los voluntarios llevaban en Excel, publicada para que el
 * estudiantado sepa cuándo puede ir a prestar una bata.
 */
export function HorariosAtencion({ dias }: { dias: DiaConTurnos[] }) {
  if (dias.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        Todavía no hay turnos de atención publicados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dias.map((dia) => (
        <div key={dia.dia} className="border-borde bg-superficie rounded-[1.25rem] border p-5">
          <h3 className="text-texto text-base font-bold">{dia.etiqueta}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {dia.turnos.map((turno) => (
              <li
                key={turno.idTurno}
                className="border-borde flex flex-wrap items-center justify-between gap-2 border-t pt-2 first:border-t-0 first:pt-0"
              >
                <span className="text-texto text-sm font-semibold">{turno.rango}</span>
                <span className="text-texto-suave text-sm">
                  {turno.voluntarios.length > 0 ? (
                    turno.voluntarios.join(" · ")
                  ) : (
                    <span className="italic">Sin voluntarios asignados</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
