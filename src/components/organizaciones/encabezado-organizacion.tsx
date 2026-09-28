import Image from "next/image";
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
  descripcion,
  imagenUrl,
  volver,
  etiqueta,
}: {
  nombre: string;
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
        <div className="border-borde bg-superficie relative size-24 shrink-0 overflow-hidden rounded-[1.25rem] border">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              unoptimized={imagenUrl.startsWith("/api/")}
            />
          ) : (
            <span
              aria-hidden
              className="bg-primario-suave text-primario grid size-full place-items-center text-3xl font-extrabold"
            >
              {inicialesDeNombre(nombre)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</p>
          <h1 className="text-texto mt-1 text-2xl leading-tight font-extrabold tracking-tight break-words sm:text-4xl">
            {nombre}
          </h1>
          {descripcion && (
            <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">{descripcion}</p>
          )}
        </div>
      </div>
    </header>
  );
}
