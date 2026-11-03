import Link from "next/link";

import { TablaOportunidades } from "@/components/admin/tabla-oportunidades";
import { Paginacion } from "@/components/eventos/paginacion";
import { Boton } from "@/components/ui/boton";
import {
  contarOportunidadesPorEstado,
  listarOportunidadesPanel,
} from "@/lib/horas-beca/consultas-oportunidades";
import {
  DESCRIPCIONES_ESTADO_OPORTUNIDAD,
  ESTADOS_OPORTUNIDAD,
  ETIQUETAS_ESTADO_OPORTUNIDAD,
  interpretarEstadoOportunidad,
} from "@/validators/oportunidad-admin";

export const dynamic = "force-dynamic";

const RUTA = "/admin/horas-beca/oportunidades";

export default async function PaginaAdminOportunidades({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const estado = interpretarEstadoOportunidad(parametros.estado);
  const numero = Number(
    Array.isArray(parametros.pagina) ? parametros.pagina[0] : parametros.pagina
  );
  const pagina = Number.isSafeInteger(numero) && numero > 0 ? numero : 1;

  const [listado, conteo] = await Promise.all([
    listarOportunidadesPanel({ estado, pagina }),
    contarOportunidadesPorEstado(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/horas-beca"
            className="text-primario text-sm font-bold hover:underline"
          >
            ← Volver a horas beca
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
            Convocatorias para realizar horas
          </h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
            Las convocatorias nacen como borrador y solo se ven en el sitio cuando se publican. Una
            que ya tiene horas registradas se cancela en lugar de eliminarse, para conservar el
            historial.
          </p>
        </div>

        <Link href={`${RUTA}/nueva`}>
          <Boton>Nueva convocatoria</Boton>
        </Link>
      </div>

      {/* Los estados funcionan como filtro y como contador a la vez: AEUVG
          abre esta pantalla para saber qué le falta publicar. */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={RUTA}
          className={`border-borde inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors ${
            estado === undefined
              ? "bg-primario border-primario text-white"
              : "bg-superficie text-texto hover:bg-superficie-suave"
          }`}
        >
          Todas ({Object.values(conteo).reduce((total, valor) => total + valor, 0)})
        </Link>

        {ESTADOS_OPORTUNIDAD.map((valor) => (
          <Link
            key={valor}
            href={`${RUTA}?estado=${valor.toLowerCase()}`}
            title={DESCRIPCIONES_ESTADO_OPORTUNIDAD[valor]}
            className={`border-borde inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors ${
              estado === valor
                ? "bg-primario border-primario text-white"
                : "bg-superficie text-texto hover:bg-superficie-suave"
            }`}
          >
            {ETIQUETAS_ESTADO_OPORTUNIDAD[valor]} ({conteo[valor]})
          </Link>
        ))}
      </div>

      {listado.oportunidades.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-14 text-center text-sm">
          {estado === undefined
            ? "Todavía no hay convocatorias. Crea la primera con el botón de arriba."
            : `No hay convocatorias en estado ${ETIQUETAS_ESTADO_OPORTUNIDAD[estado].toLocaleLowerCase("es")}.`}
        </div>
      ) : (
        <TablaOportunidades oportunidades={listado.oportunidades} />
      )}

      <Paginacion
        pagina={listado.pagina}
        paginas={listado.paginas}
        ruta={RUTA}
        parametros={estado ? { estado: estado.toLowerCase() } : {}}
        etiqueta="Páginas de convocatorias"
      />
    </div>
  );
}
