import Link from "next/link";

import { TarjetaEvento } from "@/components/eventos/tarjeta-evento";
import { RedesSociales } from "@/components/organizaciones/redes-sociales";
import {
  obtenerEventosDestacados,
  obtenerProximosEventos,
  obtenerRedesAeuvg,
} from "@/lib/inicio/consultas-inicio";

function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed p-10 text-center text-sm">
      {mensaje}
    </div>
  );
}

export async function ActividadesDestacadas() {
  const eventos = await obtenerEventosDestacados();

  return (
    <section className="bg-superficie-suave">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-texto text-3xl font-extrabold tracking-tight">
              Actividades destacadas
            </h2>
            <p className="text-texto-suave mt-2 max-w-2xl">
              Lo que AEUVG quiere que no te pierdas este ciclo.
            </p>
          </div>
          <Link href="/calendario" className="text-primario text-sm font-bold hover:underline">
            Ver el calendario →
          </Link>
        </div>

        <div className="mt-8">
          {eventos.length === 0 ? (
            <EstadoVacio mensaje="Todavía no hay actividades destacadas. Revisa la cartelera completa de eventos." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {eventos.map((evento) => (
                <TarjetaEvento key={evento.idEvento} evento={evento} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export async function ProximosEventos() {
  const eventos = await obtenerProximosEventos();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-texto text-3xl font-extrabold tracking-tight">Próximos eventos</h2>
          <p className="text-texto-suave mt-2 max-w-2xl">
            Actividades académicas, culturales y de voluntariado organizadas por las asociaciones.
          </p>
        </div>
        <Link href="/eventos" className="text-primario text-sm font-bold hover:underline">
          Ver todos los eventos →
        </Link>
      </div>

      <div className="mt-8">
        {eventos.length === 0 ? (
          <EstadoVacio mensaje="Aún no hay eventos publicados para las próximas fechas." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {eventos.map((evento) => (
              <TarjetaEvento key={evento.idEvento} evento={evento} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export async function SeccionRedesAeuvg() {
  const redes = await obtenerRedesAeuvg();

  if (redes.length === 0) return null;

  return (
    <section className="bg-superficie-suave">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-texto text-2xl font-extrabold tracking-tight">Síguenos</h2>
        <p className="text-texto-suave mt-2">
          Enterate de las convocatorias y actividades también por nuestras redes.
        </p>

        <RedesSociales redes={redes} className="mt-6" />
      </div>
    </section>
  );
}
