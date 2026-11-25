import { FiltrosTutores } from "@/components/admin/filtros-tutores";
import { PestanasTutorias } from "@/components/admin/pestanas-tutorias";
import { TablaTutores } from "@/components/admin/tabla-tutores";
import {
  contarPostulacionesPorEstado,
  listarCursos,
  listarTutoresPanel,
  type FiltrosTutoresPanel,
} from "@/lib/tutorias/consultas-tutorias";
import { ESTADOS_TUTOR } from "@/lib/tutorias/formato-tutorias";

export const dynamic = "force-dynamic";

type Parametros = Record<string, string | string[] | undefined>;

const primero = (valor: string | string[] | undefined) =>
  (Array.isArray(valor) ? valor[0] : valor)?.trim() || undefined;

/** Filtros pedidos en la dirección; lo que no se reconoce se ignora. */
function interpretarFiltros(parametros: Parametros): FiltrosTutoresPanel {
  const q = primero(parametros.q)?.slice(0, 100);
  const estadoTexto = primero(parametros.estado)?.toUpperCase();
  const estado = ESTADOS_TUTOR.find((valor) => valor === estadoTexto);
  const idCurso = Number(primero(parametros.curso));

  return {
    q,
    estado,
    idCurso: Number.isSafeInteger(idCurso) && idCurso > 0 ? idCurso : undefined,
  };
}

export default async function PaginaAdminTutorias({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const filtros = interpretarFiltros(await searchParams);

  const [tutores, cursos, conteo] = await Promise.all([
    listarTutoresPanel(filtros),
    listarCursos(),
    contarPostulacionesPorEstado(),
  ]);

  const filtrando = Boolean(filtros.q || filtros.estado || filtros.idCurso);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Tutorías</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Tutores aprobados con sus cursos. Un tutor inactivo o suspendido desaparece del
          directorio, pero conserva sus tutorías realizadas y vuelve en cuanto se reactive.
        </p>
      </div>

      <PestanasTutorias activa="tutores" pendientes={conteo.PENDIENTE} />

      <FiltrosTutores filtros={filtros} cursos={cursos} />

      <section className="flex flex-col gap-4">
        <p className="text-texto-suave text-sm">
          {tutores.length === 1 ? "1 tutor" : `${tutores.length} tutores`}
          {filtrando ? " con los filtros aplicados" : ""}
        </p>

        {tutores.length === 0 ? (
          <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
            {filtrando
              ? "Ningún tutor coincide con los filtros."
              : "Todavía no hay tutores. Aprueba una postulación para dar de alta al primero."}
          </div>
        ) : (
          <TablaTutores tutores={tutores} />
        )}
      </section>
    </div>
  );
}
