import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { ListaEventos } from "@/components/eventos/lista-eventos";
import { Paginacion } from "@/components/eventos/paginacion";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { listarEventosPublicados } from "@/lib/eventos/consultas-eventos";

// El listado consulta la base en cada petición: los eventos cambian a diario y
// no tiene sentido servir una versión generada durante el build.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eventos",
  description:
    "Conferencias, festivales, convocatorias de horas beca y actividades organizadas por AEUVG y las asociaciones estudiantiles de la Universidad del Valle de Guatemala.",
};

function numeroDePagina(valor: string | string[] | undefined): number {
  const numero = Number(Array.isArray(valor) ? valor[0] : valor);

  return Number.isSafeInteger(numero) && numero > 0 ? numero : 1;
}

export default async function PaginaEventos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const ahora = new Date();
  const { eventos, total, pagina, paginas } = await listarEventosPublicados({
    pagina: numeroDePagina(parametros.pagina),
    ahora,
  });

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-4xl font-extrabold tracking-tight">Eventos estudiantiles</h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Conferencias, festivales, convocatorias de horas beca y actividades organizadas por AEUVG
          y las asociaciones estudiantiles de la Universidad del Valle de Guatemala.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <p className="text-texto-suave text-sm">
          {total === 0
            ? "Sin eventos por mostrar"
            : `Mostrando ${eventos.length} de ${total} ${total === 1 ? "evento" : "eventos"}`}
        </p>

        <div className="mt-6">
          {eventos.length === 0 ? (
            <EstadoVacioEventos
              titulo="Todavía no hay eventos publicados"
              mensaje="AEUVG y las asociaciones estudiantiles publican aquí sus actividades del ciclo. Vuelve pronto o revisa la página principal."
              accion={{ href: "/", texto: "Ir a la página principal" }}
            />
          ) : (
            <ListaEventos eventos={eventos} ahora={ahora} />
          )}
        </div>

        <Paginacion pagina={pagina} paginas={paginas} ruta="/eventos" />
      </section>
    </MarcoSitio>
  );
}
