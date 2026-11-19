import Link from "next/link";

import { TarjetaEvento } from "@/components/eventos/tarjeta-evento";
import type { EventoResumen } from "@/lib/eventos/consultas-eventos";

/**
 * Eventos recomendados para el estudiante.
 *
 * Salen de las categorías que marcó y no de lo más popular: la plataforma
 * todavía no tiene volumen para que "lo popular" signifique algo, y presentar
 * la cartelera ordenada por fecha como recomendación personal sería falso.
 *
 * Sin intereses marcados no se muestra una lista vacía: se explica de dónde
 * saldría y se enlaza a marcarlos.
 */
export function RecomendacionesPerfil({
  eventos,
  ahora,
  sinIntereses,
}: {
  eventos: EventoResumen[];
  ahora: Date;
  sinIntereses: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-texto text-lg font-bold">Para ti</h2>
          <p className="text-texto-suave mt-1 text-sm leading-relaxed">
            Actividades próximas de los tipos que marcaste, sin las que ya guardaste.
          </p>
        </div>

        <Link href="/eventos" className="text-primario text-sm font-bold hover:underline">
          Ver toda la cartelera →
        </Link>
      </div>

      {sinIntereses ? (
        <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center">
          <p className="text-texto text-sm font-bold">Todavía no marcaste qué te interesa</p>
          <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Marca abajo los tipos de actividad que te gustan y aquí te mostramos las próximas.
          </p>
        </div>
      ) : eventos.length === 0 ? (
        <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center">
          <p className="text-texto text-sm font-bold">No hay nada próximo de lo que marcaste</p>
          <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Vuelve a revisar más adelante, o mira la cartelera completa.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {eventos.map((evento) => (
            <TarjetaEvento key={evento.idEvento} evento={evento} ahora={ahora} />
          ))}
        </div>
      )}
    </section>
  );
}
