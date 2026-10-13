import Link from "next/link";

import { Boton } from "@/components/ui/boton";
import {
  contarFiltrosHoras,
  ESTADOS_HORA_BECA,
  ETIQUETAS_ESTADO_HORA_BECA,
  ETIQUETAS_VINCULO_HORA_BECA,
  VINCULOS_HORA_BECA,
  type FiltrosHorasBeca,
} from "@/validators/horas-beca";

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
 * Buscador y filtros del panel de horas beca.
 *
 * Es un formulario común enviado por GET, sin JavaScript propio, igual que el
 * buscador de asociaciones: el resultado queda escrito en la dirección y así
 * puede compartirse o guardarse. La página se vuelve a generar en el servidor,
 * que es donde se calculan los totales del periodo.
 *
 * Los filtros se presentan desplegados y no detrás de un botón, al contrario que
 * en la cartelera: aquí filtrar es la operación habitual y no la excepción.
 */
export function FiltrosHorasBecaPanel({ filtros }: { filtros: FiltrosHorasBeca }) {
  const activos = contarFiltrosHoras(filtros);

  return (
    <form
      method="get"
      action="/admin/horas-beca"
      className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
    >
      <Campo etiqueta="Buscar" nombre="q" ancho="min-w-56 flex-1">
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre, carnet o actividad"
          className={claseCampo}
        />
      </Campo>

      <Campo etiqueta="Estado" nombre="estado">
        <select
          id="estado"
          name="estado"
          defaultValue={filtros.estado ?? ""}
          className={claseCampo}
        >
          <option value="">Todos</option>
          {ESTADOS_HORA_BECA.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETAS_ESTADO_HORA_BECA[estado]}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Desde" nombre="desde">
        <input
          id="desde"
          name="desde"
          type="date"
          defaultValue={filtros.desde ?? ""}
          className={claseCampo}
        />
      </Campo>

      <Campo etiqueta="Hasta" nombre="hasta">
        <input
          id="hasta"
          name="hasta"
          type="date"
          defaultValue={filtros.hasta ?? ""}
          className={claseCampo}
        />
      </Campo>

      <Campo etiqueta="Cuenta" nombre="vinculo">
        <select
          id="vinculo"
          name="vinculo"
          defaultValue={filtros.vinculo ?? ""}
          className={claseCampo}
        >
          <option value="">Todas</option>
          {VINCULOS_HORA_BECA.map((vinculo) => (
            <option key={vinculo} value={vinculo}>
              {ETIQUETAS_VINCULO_HORA_BECA[vinculo]}
            </option>
          ))}
        </select>
      </Campo>

      <div className="flex items-center gap-2">
        <Boton type="submit" variante="contorno">
          Filtrar
        </Boton>

        {/* El enlace de limpieza solo aparece cuando hay algo que limpiar: un
            botón permanente que no hace nada confunde más de lo que ayuda. */}
        {activos > 0 && (
          <Link
            href="/admin/horas-beca"
            className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
