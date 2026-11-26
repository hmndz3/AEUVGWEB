import Link from "next/link";

const PESTANAS = [
  { clave: "horas", href: "/admin/reportes", texto: "Horas beca" },
  { clave: "eventos", href: "/admin/reportes/eventos", texto: "Eventos" },
] as const;

export type PestanaReportes = (typeof PESTANAS)[number]["clave"];

/**
 * Subsecciones de Reportes en el panel.
 *
 * Los dos reportes responden preguntas distintas —cómo va el programa de horas
 * beca y qué actividades se hicieron—, así que cada uno tiene su pantalla con
 * sus propios filtros en lugar de una sola llena de controles.
 */
export function PestanasReportes({ activa }: { activa: PestanaReportes }) {
  return (
    <nav aria-label="Secciones de reportes" className="border-borde flex gap-1 border-b">
      {PESTANAS.map((pestana) => {
        const actual = pestana.clave === activa;

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
          </Link>
        );
      })}
    </nav>
  );
}
