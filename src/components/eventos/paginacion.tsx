import Link from "next/link";

import { cn } from "@/lib/utils";

/** Ventana de páginas que se muestra alrededor de la actual. */
const VENTANA = 2;

function paginasVisibles(pagina: number, paginas: number): number[] {
  const desde = Math.max(1, Math.min(pagina - VENTANA, paginas - VENTANA * 2));
  const hasta = Math.min(paginas, Math.max(pagina + VENTANA, VENTANA * 2 + 1));

  return Array.from({ length: hasta - desde + 1 }, (_, indice) => desde + indice);
}

/**
 * Paginación por enlaces. Se resuelve con direcciones y no con estado del
 * navegador para que cada página del listado pueda compartirse y para que el
 * contenido lo siga generando el servidor.
 */
export function Paginacion({
  pagina,
  paginas,
  ruta,
  parametros = {},
}: {
  pagina: number;
  paginas: number;
  ruta: string;
  parametros?: Record<string, string>;
}) {
  if (paginas <= 1) return null;

  const enlace = (numero: number) => {
    const consulta = new URLSearchParams(parametros);
    if (numero > 1) consulta.set("pagina", String(numero));
    else consulta.delete("pagina");

    const texto = consulta.toString();
    return texto ? `${ruta}?${texto}` : ruta;
  };

  const claseBase =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Páginas de eventos" className="mt-10 flex flex-wrap items-center gap-2">
      {pagina > 1 && (
        <Link
          href={enlace(pagina - 1)}
          rel="prev"
          className={cn(
            claseBase,
            "border-borde bg-superficie text-texto hover:bg-superficie-suave"
          )}
        >
          Anterior
        </Link>
      )}

      {paginasVisibles(pagina, paginas).map((numero) => (
        <Link
          key={numero}
          href={enlace(numero)}
          aria-current={numero === pagina ? "page" : undefined}
          className={cn(
            claseBase,
            numero === pagina
              ? "border-primario bg-primario text-white"
              : "border-borde bg-superficie text-texto hover:bg-superficie-suave"
          )}
        >
          {numero}
        </Link>
      ))}

      {pagina < paginas && (
        <Link
          href={enlace(pagina + 1)}
          rel="next"
          className={cn(
            claseBase,
            "border-borde bg-superficie text-texto hover:bg-superficie-suave"
          )}
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
