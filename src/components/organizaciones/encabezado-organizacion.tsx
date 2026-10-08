import Link from "next/link";

import { inicialesDeNombre } from "@/lib/inicio/consultas-asociacion";

/**
 * Encabezado de la página de una organización. Lo comparten las asociaciones y
 * los clubes: las dos secciones presentan la misma información en la cabecera y
 * mantenerlas iguales evita que una quede desalineada cuando se ajusta la otra.
 *
 * Cuando no hay imagen cargada se presentan las iniciales sobre el color de la
 * sección, igual que en la junta directiva de la página institucional, para que
 * la cabecera no se vea como un espacio roto.
 */
export function EncabezadoOrganizacion({
  nombre,
  siglas = null,
  descripcion,
  imagenUrl,
  volver,
  etiqueta,
}: {
  nombre: string;
  /** Siglas o nombre corto de una asociación; si existen encabezan la página. */
  siglas?: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  volver: { href: string; texto: string };
  etiqueta: string;
}) {
  return (
    <header>
      <Link href={volver.href} className="text-primario text-sm font-bold hover:underline">
        ← {volver.texto}
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* En teléfono el logotipo cede espacio al nombre, que es lo que hay
            que leer primero. */}
        <div className="border-borde bg-superficie relative size-20 shrink-0 overflow-hidden rounded-[1.25rem] border sm:size-24">
          {imagenUrl ? (
            // Etiqueta de imagen normal y no el componente optimizado: el enlace
            // lo escribe AEUVG desde el panel y el optimizador rechaza, rompiendo
            // la página, cualquier dominio que no se haya declarado de antemano.
            // Ver src/components/eventos/imagen-evento.tsx.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenUrl} alt="" decoding="async" className="size-full object-cover" />
          ) : (
            <span
              aria-hidden
              className="bg-primario-suave text-primario grid size-full place-items-center text-3xl font-extrabold"
            >
              {inicialesDeNombre(siglas ?? nombre)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</p>
          <h1 className="text-texto mt-1 text-2xl leading-tight font-extrabold tracking-tight break-words sm:text-4xl">
            {siglas ?? nombre}
          </h1>
          {siglas && (
            <p className="text-texto mt-1 text-base leading-snug font-semibold break-words sm:text-lg">
              {nombre}
            </p>
          )}
          {descripcion && (
            <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">{descripcion}</p>
          )}
        </div>
      </div>
    </header>
  );
}
