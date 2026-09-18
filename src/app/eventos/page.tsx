import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { FiltrosAplicados } from "@/components/eventos/filtros-aplicados";
import { FiltrosEventosBarra } from "@/components/eventos/filtros-eventos";
import { ListaEventos } from "@/components/eventos/lista-eventos";
import { Paginacion } from "@/components/eventos/paginacion";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import {
  listarCategorias,
  listarEventosPublicados,
  listarOrganizadores,
} from "@/lib/eventos/consultas-eventos";
import { condicionesDeFiltros } from "@/lib/eventos/filtros-eventos";
import {
  contarFiltros,
  interpretarFiltrosEventos,
  parametrosDeFiltros,
} from "@/validators/eventos";

// El listado consulta la base en cada petición: los eventos cambian a diario y
// no tiene sentido servir una versión generada durante el build.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eventos",
  description:
    "Conferencias, festivales, convocatorias de horas beca y actividades organizadas por AEUVG y las asociaciones estudiantiles de la Universidad del Valle de Guatemala.",
};

export default async function PaginaEventos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = interpretarFiltrosEventos(await searchParams);
  const ahora = new Date();
  const [{ eventos, total, pagina, paginas }, categorias, organizadores] = await Promise.all([
    listarEventosPublicados({
      pagina: filtros.pagina,
      condiciones: condicionesDeFiltros(filtros),
      ahora,
    }),
    listarCategorias(),
    listarOrganizadores(),
  ]);

  const conFiltros = contarFiltros(filtros) > 0;

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
          Eventos estudiantiles
        </h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Conferencias, festivales, convocatorias de horas beca y actividades organizadas por AEUVG
          y las asociaciones estudiantiles de la Universidad del Valle de Guatemala.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <FiltrosEventosBarra
          filtros={filtros}
          categorias={categorias}
          organizadores={organizadores}
        />

        <FiltrosAplicados filtros={filtros} categorias={categorias} organizadores={organizadores} />

        <p className="text-texto-suave mt-6 text-sm">
          {total === 0
            ? "Sin eventos por mostrar"
            : `Mostrando ${eventos.length} de ${total} ${total === 1 ? "evento" : "eventos"}`}
        </p>

        <div className="mt-6">
          {eventos.length === 0 ? (
            conFiltros ? (
              <EstadoVacioEventos
                titulo="Ningún evento coincide con la búsqueda"
                mensaje="Prueba con otras fechas, otra categoría o quita algunos filtros para ver más actividades."
                accion={{ href: "/eventos", texto: "Limpiar los filtros" }}
              />
            ) : (
              <EstadoVacioEventos
                titulo="Todavía no hay eventos publicados"
                mensaje="AEUVG y las asociaciones estudiantiles publican aquí sus actividades del ciclo. Vuelve pronto o revisa la página principal."
                accion={{ href: "/", texto: "Ir a la página principal" }}
              />
            )
          ) : (
            <ListaEventos eventos={eventos} ahora={ahora} />
          )}
        </div>

        <Paginacion
          pagina={pagina}
          paginas={paginas}
          ruta="/eventos"
          parametros={parametrosDeFiltros(filtros)}
        />
      </section>
    </MarcoSitio>
  );
}
