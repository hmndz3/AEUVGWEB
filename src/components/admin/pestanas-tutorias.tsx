import Link from "next/link";

const PESTANAS = [
  { clave: "tutores", href: "/admin/tutorias", texto: "Tutores" },
  { clave: "postulaciones", href: "/admin/tutorias/postulaciones", texto: "Postulaciones" },
  { clave: "cursos", href: "/admin/tutorias/cursos", texto: "Cursos" },
  { clave: "horas", href: "/admin/tutorias/horas", texto: "Horas" },
] as const;

export type PestanaTutorias = (typeof PESTANAS)[number]["clave"];

/**
 * Subsecciones de Tutorías en el panel.
 *
 * Los tutores son la vista de entrada; las postulaciones y el catálogo de
 * cursos viven en su propia pestaña para no llenar la pantalla de datos que
 * solo se necesitan al revisar. Las pendientes y los cursos propuestos se
 * cuentan en la pestaña para que no se olviden aunque no estén a la vista.
 */
export function PestanasTutorias({
  activa,
  pendientes = 0,
  propuestos = 0,
  horasPorRevisar = 0,
}: {
  activa: PestanaTutorias;
  pendientes?: number;
  propuestos?: number;
  horasPorRevisar?: number;
}) {
  const contadores: Partial<Record<PestanaTutorias, number>> = {
    postulaciones: pendientes,
    cursos: propuestos,
    horas: horasPorRevisar,
  };

  return (
    <nav aria-label="Secciones de tutorías" className="border-borde flex gap-1 border-b">
      {PESTANAS.map((pestana) => {
        const actual = pestana.clave === activa;
        const contador = contadores[pestana.clave] ?? 0;

        return (
          <Link
            key={pestana.clave}
            href={pestana.href}
            aria-current={actual ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
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
