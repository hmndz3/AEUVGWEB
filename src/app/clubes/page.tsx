import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { Paginacion } from "@/components/eventos/paginacion";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { BuscadorOrganizaciones } from "@/components/organizaciones/buscador-organizaciones";
import { ListaOrganizaciones } from "@/components/organizaciones/lista-organizaciones";
import { listarClubes } from "@/lib/organizaciones/consultas-organizaciones";
import {
  interpretarFiltrosOrganizaciones,
  parametrosDeOrganizaciones,
} from "@/validators/organizaciones";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clubes",
  description:
    "Clubes estudiantiles de la Universidad del Valle de Guatemala: qué actividades realizan y cómo integrarse.",
};

export default async function PaginaClubes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = interpretarFiltrosOrganizaciones(await searchParams);
  const { organizaciones, total, pagina, paginas } = await listarClubes({
    pagina: filtros.pagina,
    busqueda: filtros.q,
  });

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
          Clubes estudiantiles
        </h1>
        <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
          Los clubes reúnen a quienes comparten un interés, desde el deporte y la música hasta la
          tecnología y el voluntariado. Aquí puedes ver qué hace cada uno y cómo integrarte.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <BuscadorOrganizaciones
          ruta="/clubes"
          busqueda={filtros.q}
          etiqueta="Nombre, descripción o actividades"
        />

        <p className="text-texto-suave mt-6 text-sm">
          {total === 0
            ? "Sin clubes por mostrar"
            : `Mostrando ${organizaciones.length} de ${total} ${total === 1 ? "club" : "clubes"}`}
        </p>

        <div className="mt-6">
          {organizaciones.length === 0 ? (
            filtros.q ? (
              <EstadoVacioEventos
                titulo="Ningún club coincide con la búsqueda"
                mensaje="Prueba con otro nombre o con la actividad que te interesa, o revisa el listado completo."
                accion={{ href: "/clubes", texto: "Ver todos los clubes" }}
              />
            ) : (
              <EstadoVacioEventos
                titulo="Todavía no hay clubes publicados"
                mensaje="AEUVG está cargando la información de los clubes del campus. Vuelve pronto o revisa las asociaciones estudiantiles."
                accion={{ href: "/asociaciones", texto: "Ver las asociaciones" }}
              />
            )
          ) : (
            <ListaOrganizaciones organizaciones={organizaciones} ruta="/clubes" />
          )}
        </div>

        <Paginacion
          pagina={pagina}
          paginas={paginas}
          ruta="/clubes"
          parametros={parametrosDeOrganizaciones(filtros)}
        />
      </section>
    </MarcoSitio>
  );
}
