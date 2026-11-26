import type {
  DisponibilidadTalla,
  InventarioPublico,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

/** Una talla con su disponibilidad, coloreada según queden existencias o no. */
function Talla({ dato }: { dato: DisponibilidadTalla }) {
  const agotado = dato.disponible <= 0;

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-3 py-2.5 text-center ${
        agotado ? "border-borde bg-superficie-suave" : "border-turquesa/30 bg-turquesa/10"
      }`}
    >
      <span className="text-texto-suave text-xs font-bold tracking-wide uppercase">
        {dato.talla}
      </span>
      <span
        className={`mt-0.5 text-lg font-extrabold ${agotado ? "text-texto-suave" : "text-sobre-turquesa"}`}
      >
        {dato.disponible}
      </span>
      <span className="text-texto-suave text-[11px]">de {dato.total}</span>
    </div>
  );
}

function GrupoBata({ titulo, tallas }: { titulo: string; tallas: DisponibilidadTalla[] }) {
  if (tallas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-texto text-sm font-bold">{titulo}</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {tallas.map((talla) => (
          <Talla key={talla.talla} dato={talla} />
        ))}
      </div>
    </div>
  );
}

/**
 * Disponibilidad de batas y lentes que ve el estudiantado antes de ir al salón.
 * Las cifras se descuentan de los préstamos sin devolver, así que reflejan lo
 * que de verdad hay para prestar en este momento.
 */
export function DisponibilidadInventario({ inventario }: { inventario: InventarioPublico }) {
  const sinInventario =
    inventario.batasAzules.length === 0 &&
    inventario.batasBlancas.length === 0 &&
    inventario.lentes === null;

  if (sinInventario) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        Todavía no hay inventario cargado. Vuelve pronto para ver qué hay disponible.
      </div>
    );
  }

  return (
    <div className="border-borde bg-superficie flex flex-col gap-6 rounded-[1.25rem] border p-5 sm:p-6">
      <GrupoBata titulo="Batas azules" tallas={inventario.batasAzules} />
      <GrupoBata titulo="Batas blancas" tallas={inventario.batasBlancas} />

      {inventario.lentes && (
        <div className="flex flex-col gap-2">
          <h3 className="text-texto text-sm font-bold">Lentes de protección</h3>
          <div
            className={`flex items-baseline gap-2 rounded-2xl border px-4 py-3 ${
              inventario.lentes.disponible <= 0
                ? "border-borde bg-superficie-suave"
                : "border-turquesa/30 bg-turquesa/10"
            }`}
          >
            <span
              className={`text-2xl font-extrabold ${
                inventario.lentes.disponible <= 0 ? "text-texto-suave" : "text-sobre-turquesa"
              }`}
            >
              {inventario.lentes.disponible}
            </span>
            <span className="text-texto-suave text-sm">
              disponibles de {inventario.lentes.total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
