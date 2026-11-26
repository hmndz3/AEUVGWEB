"use client";

import { RejillaTurnos } from "@/components/prestamo-batas/rejilla-turnos";
import type { TurnoPublico } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/**
 * Horarios en los que el salón está abierto, con quién atiende cada turno.
 * Es la tabla que los voluntarios llevaban en Excel, publicada como horario
 * para que el estudiantado ubique de un vistazo cuándo puede ir a prestar una
 * bata.
 */
export function HorariosAtencion({ turnos }: { turnos: TurnoPublico[] }) {
  return (
    <RejillaTurnos
      turnos={turnos}
      casilla={(turno) => (
        <div
          className={`flex h-full flex-col gap-1 rounded-xl px-2.5 py-2 text-xs ${
            turno.voluntarios.length > 0
              ? "bg-turquesa/15 text-sobre-turquesa"
              : "bg-superficie-suave text-texto-suave"
          }`}
        >
          <span className="text-[0.65rem] font-bold tracking-wide uppercase opacity-70">
            Abierto
          </span>
          {turno.voluntarios.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {turno.voluntarios.map((voluntario) => (
                <li key={voluntario} className="leading-snug font-semibold">
                  {voluntario}
                </li>
              ))}
            </ul>
          ) : (
            <span className="italic">Sin voluntarios asignados</span>
          )}
        </div>
      )}
      casillaVacia={() => (
        <div className="flex h-full min-h-10 items-center justify-center">
          <span aria-hidden className="text-texto-suave text-xs opacity-40">
            —
          </span>
        </div>
      )}
    />
  );
}
