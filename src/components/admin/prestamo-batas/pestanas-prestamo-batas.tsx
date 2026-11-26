import Link from "next/link";

const PESTANAS = [
  { clave: "inventario", href: "/admin/prestamo-batas", texto: "Inventario" },
  { clave: "turnos", href: "/admin/prestamo-batas/turnos", texto: "Turnos" },
  { clave: "postulaciones", href: "/admin/prestamo-batas/postulaciones", texto: "Postulaciones" },
  { clave: "prestamos", href: "/admin/prestamo-batas/prestamos", texto: "Préstamos" },
  { clave: "comprobantes", href: "/admin/prestamo-batas/comprobantes", texto: "Comprobantes" },
] as const;

export type PestanaPrestamoBatas = (typeof PESTANAS)[number]["clave"];

/**
 * Subsecciones del préstamo de batas en el panel. Las postulaciones y los
 * comprobantes muestran su conteo de pendientes para que no se olviden aunque no
 * estén a la vista.
 */
export function PestanasPrestamoBatas({
  activa,
  postulaciones = 0,
  comprobantes = 0,
}: {
  activa: PestanaPrestamoBatas;
  postulaciones?: number;
  comprobantes?: number;
}) {
  const contadores: Partial<Record<PestanaPrestamoBatas, number>> = {
    postulaciones,
    comprobantes,
  };

  return (
    <nav
      aria-label="Secciones del préstamo de batas"
      className="border-borde flex gap-1 overflow-x-auto border-b"
    >
      {PESTANAS.map((pestana) => {
        const actual = pestana.clave === activa;
        const contador = contadores[pestana.clave] ?? 0;

        return (
          <Link
            key={pestana.clave}
            href={pestana.href}
            aria-current={actual ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
              actual
                ? "border-primario text-primario"
                : "text-texto-suave hover:text-texto border-transparent"
            }`}
          >
            {pestana.texto}
            {contador > 0 && (
              <span className="bg-primario rounded-full px-2 py-0.5 text-xs font-bold text-white">
                {contador}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
