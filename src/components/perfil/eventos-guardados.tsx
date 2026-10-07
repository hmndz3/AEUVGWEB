import Link from "next/link";

import { ListaEventos } from "@/components/eventos/lista-eventos";
import type { EventosGuardados } from "@/lib/perfil/consultas-eventos-guardados";

/**
 * Eventos guardados dentro del perfil.
 *
 * Los próximos van primero porque son los que todavía se pueden aprovechar; los
 * finalizados se conservan debajo, ya que el estudiante los guardó por algo y
 * borrarlos solos sería una sorpresa. Un evento cancelado desaparece de la lista
 * sin tener que quitarlo, porque la consulta solo devuelve lo publicado.
 */
export function EventosGuardadosPerfil({
  eventos,
  ahora,
}: {
  eventos: EventosGuardados;
  ahora?: Date;
}) {
  const { proximos, pasados } = eventos;
  const todosLosIds = new Set([...proximos, ...pasados].map((evento) => evento.idEvento));

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-texto text-lg font-bold">Mis eventos guardados</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Las actividades que marcaste desde la cartelera. Puedes quitarlas con la estrella de cada
          tarjeta.
        </p>
      </div>

      {proximos.length === 0 && pasados.length === 0 ? (
        <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center">
          <p className="text-texto text-sm font-bold">Todavía no has guardado ningún evento</p>
          <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Marca con la estrella las actividades que te interesan y aparecerán aquí para no
            perderlas de vista.
          </p>
          <Link
            href="/eventos"
            className="bg-primario hover:bg-primario-fuerte mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white transition-colors"
          >
            Ver la cartelera
          </Link>
        </div>
      ) : (
        <>
          {proximos.length > 0 && (
            <div>
              <h3 className="text-texto-suave text-xs font-bold tracking-wide uppercase">
                Próximos
              </h3>
              <div className="mt-4">
                <ListaEventos
                  eventos={proximos}
                  ahora={ahora}
                  guardables
                  conSesion
                  guardados={todosLosIds}
                />
              </div>
            </div>
          )}

          {pasados.length > 0 && (
            <div>
              <h3 className="text-texto-suave text-xs font-bold tracking-wide uppercase">
                Ya finalizados
              </h3>
              <div className="mt-4">
                <ListaEventos
                  eventos={pasados}
                  ahora={ahora}
                  guardables
                  conSesion
                  guardados={todosLosIds}
                />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
