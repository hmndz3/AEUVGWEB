import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import type { CursoDisponible, FiltrosTutoresPanel } from "@/lib/tutorias/consultas-tutorias";
import { ESTADOS_TUTOR, ETIQUETAS_ESTADO_TUTOR } from "@/lib/tutorias/formato-tutorias";

const RUTA = "/admin/tutorias";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

function Campo({
  etiqueta,
  nombre,
  children,
  ancho = "min-w-44",
}: {
  etiqueta: string;
  nombre: string;
  children: React.ReactNode;
  ancho?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${ancho}`}>
      <label htmlFor={nombre} className="text-texto text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

/**
 * Buscador y filtros de los tutores del panel.
 *
 * Igual que el de horas beca, es un formulario común enviado por GET: el
 * resultado queda en la dirección y la lista se genera en el servidor.
 */
export function FiltrosTutores({
  filtros,
  cursos,
}: {
  filtros: FiltrosTutoresPanel;
  cursos: CursoDisponible[];
}) {
  const activos = [filtros.q, filtros.estado, filtros.idCurso].filter(Boolean).length;

  return (
    <form
      method="get"
      action={RUTA}
      className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
    >
      <Campo etiqueta="Buscar" nombre="q" ancho="min-w-56 flex-1">
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre o carnet"
          className={claseCampo}
        />
      </Campo>

      <Campo etiqueta="Estado" nombre="estado">
        <select
          id="estado"
          name="estado"
          defaultValue={filtros.estado?.toLowerCase() ?? ""}
          className={claseCampo}
        >
          <option value="">Todos</option>
          {ESTADOS_TUTOR.map((estado) => (
            <option key={estado} value={estado.toLowerCase()}>
              {ETIQUETAS_ESTADO_TUTOR[estado]}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Curso" nombre="curso" ancho="min-w-56">
        <select
          id="curso"
          name="curso"
          defaultValue={filtros.idCurso ? String(filtros.idCurso) : ""}
          className={claseCampo}
        >
          <option value="">Todos</option>
          {cursos.map((curso) => (
            <option key={curso.idCurso} value={curso.idCurso}>
              {curso.codigo} · {curso.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <div className="flex items-center gap-2">
        <Boton type="submit" variante="contorno">
          Filtrar
        </Boton>

        {activos > 0 && (
          <Link
            href={RUTA}
            className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
