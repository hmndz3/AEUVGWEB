import { FiltrosReporteEventos } from "@/components/admin/filtros-reporte-eventos";
import { PestanasReportes } from "@/components/admin/pestanas-reportes";
import {
  DescargarReporteEventos,
  ResumenReporteEventos,
  TablaEventosReporte,
  TablaMetrica,
} from "@/components/admin/reporte-eventos";
import { Alerta } from "@/components/ui/alerta";
import {
  obtenerCatalogosReporteEventos,
  obtenerEventosDelReporte,
} from "@/lib/eventos/consultas-reporte-eventos";
import {
  eventosPorCategoria,
  eventosPorMes,
  eventosPorOrganizador,
  resumirEventos,
} from "@/lib/eventos/metricas-eventos";
import {
  interpretarFiltrosEventosReporte,
  parametrosDeFiltrosEventos,
} from "@/validators/reporte-eventos";

export const dynamic = "force-dynamic";

export default async function PaginaReporteEventos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = interpretarFiltrosEventosReporte(await searchParams);

  const [catalogos, resultado] = await Promise.all([
    obtenerCatalogosReporteEventos(),
    obtenerEventosDelReporte(filtros),
  ]);

  const eventos = resultado.tipo === "listo" ? resultado.eventos : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Reportes</h1>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Qué actividades se hicieron y qué alcance tuvieron. Filtra por periodo, organizador,
          categoría, tipo o estado, y descarga lo que estés viendo con todos los datos de cada
          evento.
        </p>
      </div>

      <PestanasReportes activa="eventos" />

      <FiltrosReporteEventos filtros={filtros} catalogos={catalogos} />

      {resultado.tipo === "demasiados" ? (
        <Alerta tipo="error" titulo="El reporte abarca demasiados eventos">
          Son {resultado.total} eventos y el máximo son {resultado.maximo}. Acota el periodo o
          aplica un filtro.
        </Alerta>
      ) : (
        <>
          <ResumenReporteEventos resumen={resumirEventos(eventos)} />

          {eventos.length > 0 && (
            <DescargarReporteEventos parametros={parametrosDeFiltrosEventos(filtros)} />
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-texto text-lg font-bold">Eventos por mes</h2>
            <TablaMetrica
              encabezado="Mes"
              lineas={eventosPorMes(eventos)}
              vacio="Sin eventos en este periodo."
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-texto text-lg font-bold">Por categoría</h2>
              <TablaMetrica
                encabezado="Categoría"
                lineas={eventosPorCategoria(eventos)}
                vacio="Sin eventos en este periodo."
              />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-texto text-lg font-bold">Por organizador</h2>
              {/* Un evento con varios organizadores cuenta para cada uno, así
                  que esta tabla puede sumar más que el total de eventos. */}
              <TablaMetrica
                encabezado="Organizador"
                lineas={eventosPorOrganizador(eventos)}
                vacio="Sin eventos en este periodo."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-texto text-lg font-bold">Detalle</h2>
            <TablaEventosReporte eventos={eventos} />
          </div>
        </>
      )}
    </div>
  );
}
