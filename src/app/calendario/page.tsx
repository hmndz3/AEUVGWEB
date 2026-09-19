import { ControlesCalendario } from "@/components/eventos/controles-calendario";
import { RejillaCalendario } from "@/components/eventos/rejilla-calendario";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { construirCalendario, normalizarAncla, normalizarVista } from "@/lib/eventos/calendario";
import { claveDiaLocal } from "@/lib/eventos/formato-fechas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendario de eventos",
  description:
    "Calendario mensual y semanal de las actividades organizadas por AEUVG y las asociaciones estudiantiles de la Universidad del Valle de Guatemala.",
};

function valor(parametro: string | string[] | undefined): string | undefined {
  return Array.isArray(parametro) ? parametro[0] : parametro;
}

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const hoy = new Date();
  const vista = normalizarVista(valor(parametros.vista));
  const ancla = normalizarAncla(valor(parametros.fecha), hoy);
  const calendario = construirCalendario(vista, ancla, hoy);

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
          Calendario de eventos
        </h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Las actividades del ciclo organizadas por día. Cambia entre la vista mensual y la semanal
          según lo que necesites revisar.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <ControlesCalendario calendario={calendario} claveHoy={claveDiaLocal(hoy)} />
        <RejillaCalendario calendario={calendario} />
      </section>
    </MarcoSitio>
  );
}
