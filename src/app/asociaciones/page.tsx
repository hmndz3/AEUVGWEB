import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { Paginacion } from "@/components/eventos/paginacion";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { BuscadorOrganizaciones } from "@/components/organizaciones/buscador-organizaciones";
import { ListaOrganizaciones } from "@/components/organizaciones/lista-organizaciones";
import { listarAsociaciones } from "@/lib/organizaciones/consultas-organizaciones";
import {
  interpretarFiltrosOrganizaciones,
  parametrosDeOrganizaciones,
} from "@/validators/organizaciones";

// El listado consulta la base en cada petición: AEUVG puede dar de alta o de
// baja una asociación en cualquier momento desde el panel.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Asociaciones",
  description:
    "Asociaciones estudiantiles de la Universidad del Valle de Guatemala: qué hacen, quiénes las integran y cómo contactarlas.",
};

export default async function PaginaAsociaciones({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = interpretarFiltrosOrganizaciones(await searchParams);
  const { organizaciones, total, pagina, paginas } = await listarAsociaciones({
    pagina: filtros.pagina,
    busqueda: filtros.q,
  });

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
          Asociaciones estudiantiles
        </h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Las asociaciones de facultad y de carrera representan al estudiantado y organizan buena
          parte de las actividades del campus. Aquí puedes conocer qué hace cada una, quiénes la
          integran y cómo contactarla.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <BuscadorOrganizaciones
          ruta="/asociaciones"
          busqueda={filtros.q}
          etiqueta="Nombre, siglas, descripción o misión"
        />

        <p className="text-texto-suave mt-6 text-sm">
          {total === 0
            ? "Sin asociaciones por mostrar"
            : `Mostrando ${organizaciones.length} de ${total} ${total === 1 ? "asociación" : "asociaciones"}`}
        </p>

        <div className="mt-6">
          {organizaciones.length === 0 ? (
            filtros.q ? (
              <EstadoVacioEventos
                titulo="Ninguna asociación coincide con la búsqueda"
                mensaje="Prueba con otro nombre o revisa el listado completo de asociaciones del campus."
                accion={{ href: "/asociaciones", texto: "Ver todas las asociaciones" }}
              />
            ) : (
              <EstadoVacioEventos
                titulo="Todavía no hay asociaciones publicadas"
                mensaje="AEUVG está cargando la información de las asociaciones del campus. Vuelve pronto o revisa la página principal."
                accion={{ href: "/", texto: "Ir a la página principal" }}
              />
            )
          ) : (
            <ListaOrganizaciones organizaciones={organizaciones} ruta="/asociaciones" />
          )}
        </div>

        <Paginacion
          pagina={pagina}
          paginas={paginas}
          ruta="/asociaciones"
          parametros={parametrosDeOrganizaciones(filtros)}
        />
      </section>
    </MarcoSitio>
  );
}
