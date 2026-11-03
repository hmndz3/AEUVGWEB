import Link from "next/link";

import { ListaOportunidades } from "@/components/horas-beca/lista-oportunidades";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { listarOportunidadesPublicadas } from "@/lib/horas-beca/consultas-oportunidades-publicas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Oportunidades para realizar horas beca",
  description:
    "Convocatorias abiertas para realizar horas beca en la Universidad del Valle de Guatemala: qué actividad es, cuándo, dónde y cuánta gente se necesita.",
};

export default async function PaginaOportunidades() {
  const oportunidades = await listarOportunidadesPublicadas();

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
          Oportunidades para realizar horas beca
        </h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Las convocatorias abiertas en las que puedes apoyar, de la más próxima a la más lejana.
          AEUVG registra las horas a tu carnet después de cada actividad, así que no hace falta
          inscribirte aquí: preséntate en el lugar y a la hora indicados.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {oportunidades.length === 0 ? (
          <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-16 text-center">
            <p className="text-texto text-base font-bold">
              Ahora mismo no hay convocatorias abiertas
            </p>
            <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
              AEUVG publica aquí las actividades en las que se necesita apoyo. Vuelve a revisar más
              adelante en el ciclo, o consulta tus horas ya registradas en tu perfil.
            </p>
            <Link
              href="/perfil#mis-horas-beca"
              className="text-primario mt-4 inline-flex text-sm font-bold hover:underline"
            >
              Ver mis horas beca
            </Link>
          </div>
        ) : (
          <>
            <p className="text-texto-suave mb-6 text-sm">
              {oportunidades.length}{" "}
              {oportunidades.length === 1 ? "convocatoria abierta" : "convocatorias abiertas"}
            </p>
            <ListaOportunidades oportunidades={oportunidades} />
          </>
        )}
      </section>
    </MarcoSitio>
  );
}
