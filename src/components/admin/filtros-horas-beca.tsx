import { Boton } from "@/components/ui/boton";
import type { FiltrosHorasBeca } from "@/validators/horas-beca";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

/**
 * Buscador y filtros del panel de horas beca.
 *
 * Es un formulario común enviado por GET, sin JavaScript propio, igual que el
 * buscador de asociaciones: el resultado queda escrito en la dirección y así
 * puede compartirse o guardarse. La página se vuelve a generar en el servidor,
 * que es donde se calculan los totales del periodo.
 */
export function FiltrosHorasBecaPanel({ filtros }: { filtros: FiltrosHorasBeca }) {
  return (
    <form method="get" action="/admin/horas-beca" className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <label htmlFor="q" className="text-texto text-sm font-semibold">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre, carnet o actividad"
          className={claseCampo}
        />
      </div>

      <Boton type="submit" variante="contorno">
        Buscar
      </Boton>
    </form>
  );
}
