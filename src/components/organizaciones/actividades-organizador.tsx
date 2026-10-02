import Link from "next/link";

import { ListaEventos } from "@/components/eventos/lista-eventos";
import type { ActividadesOrganizador } from "@/lib/organizaciones/eventos-organizador";

/**
 * Actividades publicadas de una asociación o de un club.
 *
 * Se presentan en dos bloques porque la página responde a dos preguntas
 * distintas: a qué puedo asistir y qué ha hecho este grupo. El bloque de
 * próximas siempre aparece, incluso vacío, ya que su ausencia es información:
 * dice que el grupo no tiene nada convocado ahora mismo. El de pasadas se omite
 * cuando no hay nada, porque entonces no explica nada.
 */
export function ActividadesOrganizador({
  actividades,
  nombre,
  filtro,
  ahora,
}: {
  actividades: ActividadesOrganizador;
  nombre: string;
  /** Parámetros con los que la cartelera queda filtrada por este organizador. */
  filtro: string;
  ahora?: Date;
}) {
  const { proximas, pasadas } = actividades;

  return (
    <>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-texto text-2xl font-extrabold tracking-tight">
            Próximas actividades
          </h2>
          {proximas.length > 0 && (
            <Link
              href={`/eventos?${filtro}`}
              className="text-primario text-sm font-bold hover:underline"
            >
              Ver todas en la cartelera →
            </Link>
          )}
        </div>

        <div className="mt-6">
          {proximas.length > 0 ? (
            <ListaEventos eventos={proximas} ahora={ahora} />
          ) : (
            <p className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
              {nombre} no tiene actividades publicadas por ahora. Revisa la cartelera para ver lo
              que organizan otros grupos.
            </p>
          )}
        </div>
      </section>

      {pasadas.length > 0 && (
        <section>
          <h2 className="text-texto text-2xl font-extrabold tracking-tight">
            Actividades anteriores
          </h2>
          <div className="mt-6">
            <ListaEventos eventos={pasadas} ahora={ahora} />
          </div>
        </section>
      )}
    </>
  );
}
