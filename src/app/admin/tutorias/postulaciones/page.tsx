import Link from "next/link";

import { ListaPostulaciones } from "@/components/admin/lista-postulaciones";
import { PestanasTutorias } from "@/components/admin/pestanas-tutorias";
import { Paginacion } from "@/components/eventos/paginacion";
import {
  contarPostulacionesPorEstado,
  listarPostulaciones,
} from "@/lib/tutorias/consultas-tutorias";
import { ESTADOS_POSTULACION, ETIQUETAS_ESTADO_POSTULACION } from "@/lib/tutorias/formato-tutorias";

export const dynamic = "force-dynamic";

const RUTA = "/admin/tutorias/postulaciones";

/** Estado pedido en la dirección, o undefined si no se reconoce. */
function interpretarEstado(valor: string | string[] | undefined) {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (!texto) return undefined;

  return ESTADOS_POSTULACION.find((estado) => estado === texto.toUpperCase());
}

export default async function PaginaAdminPostulaciones({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const estado = interpretarEstado(parametros.estado);
  const numero = Number(
    Array.isArray(parametros.pagina) ? parametros.pagina[0] : parametros.pagina
  );
  const pagina = Number.isSafeInteger(numero) && numero > 0 ? numero : 1;

  const [listado, conteo] = await Promise.all([
    listarPostulaciones({ estado, pagina }),
    contarPostulacionesPorEstado(),
  ]);

  const total = Object.values(conteo).reduce((suma, valor) => suma + valor, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Tutorías</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Postulaciones de estudiantes que quieren dar tutorías. Aprobar una postulación da de alta
          al tutor con los cursos que respaldó y lo publica en el directorio.
        </p>
      </div>

      <PestanasTutorias activa="postulaciones" pendientes={conteo.PENDIENTE} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-texto text-lg font-bold">Postulaciones</h2>

          {/* Los estados funcionan como filtro y como contador: la pregunta con
              la que se abre esta pantalla es cuántas faltan por revisar. */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={RUTA}
              className={`border-borde inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors ${
                estado === undefined
                  ? "bg-primario border-primario text-white"
                  : "bg-superficie text-texto hover:bg-superficie-suave"
              }`}
            >
              Todas ({total})
            </Link>

            {ESTADOS_POSTULACION.map((valor) => (
              <Link
                key={valor}
                href={`${RUTA}?estado=${valor.toLowerCase()}`}
                className={`border-borde inline-flex h-9 items-center rounded-full border px-4 text-sm font-bold transition-colors ${
                  estado === valor
                    ? "bg-primario border-primario text-white"
                    : "bg-superficie text-texto hover:bg-superficie-suave"
                }`}
              >
                {ETIQUETAS_ESTADO_POSTULACION[valor]} ({conteo[valor]})
              </Link>
            ))}
          </div>
        </div>

        {listado.postulaciones.length === 0 ? (
          <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
            {estado === undefined
              ? "Todavía no hay postulaciones para ser tutor."
              : `No hay postulaciones en estado ${ETIQUETAS_ESTADO_POSTULACION[estado].toLocaleLowerCase("es")}.`}
          </div>
        ) : (
          <ListaPostulaciones postulaciones={listado.postulaciones} />
        )}

        <Paginacion
          pagina={listado.pagina}
          paginas={listado.paginas}
          ruta={RUTA}
          parametros={estado ? { estado: estado.toLowerCase() } : {}}
          etiqueta="Páginas de postulaciones"
        />
      </section>
    </div>
  );
}
