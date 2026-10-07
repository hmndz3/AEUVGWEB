import Image from "next/image";
import Link from "next/link";

import { inicialesDeNombre } from "@/lib/inicio/consultas-asociacion";
import type { OrganizacionResumen } from "@/lib/organizaciones/consultas-organizaciones";
import { cn } from "@/lib/utils";

/** Caracteres de descripción que caben en la tarjeta sin desalinear la rejilla. */
const MAXIMO_RESUMEN = 160;

/**
 * Recorta la descripción en el último espacio antes del límite, para no cortar
 * una palabra por la mitad.
 */
function resumir(texto: string): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= MAXIMO_RESUMEN) return limpio;

  const recortado = limpio.slice(0, MAXIMO_RESUMEN);
  const corte = recortado.lastIndexOf(" ");

  return `${(corte > 0 ? recortado.slice(0, corte) : recortado).trimEnd()}…`;
}

/**
 * Tarjeta de una asociación o de un club. Es el mismo componente en las dos
 * secciones: un grupo estudiantil se presenta igual sea del tipo que sea, y una
 * sola tarjeta evita que las dos rejillas se separen visualmente con el tiempo.
 */
export function TarjetaOrganizacion({
  organizacion,
  ruta,
  className,
}: {
  organizacion: OrganizacionResumen;
  /** Sección a la que pertenece: "/asociaciones" o "/clubes". */
  ruta: string;
  className?: string;
}) {
  return (
    <article className={cn("h-full", className)}>
      <Link
        href={`${ruta}/${organizacion.id}`}
        className={cn(
          "border-borde bg-superficie flex h-full flex-col overflow-hidden rounded-[1.25rem] border p-5 shadow-sm",
          "focus-visible:ring-primario transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
        )}
      >
        {/* min-w-0 en el contenedor: sin él, un nombre largo empuja el logotipo
            fuera de la tarjeta en lugar de partirse en dos líneas. */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="border-borde bg-superficie relative size-14 shrink-0 overflow-hidden rounded-2xl border">
            {organizacion.imagenUrl ? (
              <Image
                src={organizacion.imagenUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                unoptimized={organizacion.imagenUrl.startsWith("/api/")}
              />
            ) : (
              <span
                aria-hidden
                className="bg-primario-suave text-primario grid size-full place-items-center text-lg font-extrabold"
              >
                {inicialesDeNombre(organizacion.nombre)}
              </span>
            )}
          </div>

          <h3 className="text-texto min-w-0 text-base leading-snug font-bold break-words">
            {organizacion.nombre}
          </h3>
        </div>

        {organizacion.descripcion ? (
          <p className="text-texto-suave mt-4 text-sm leading-relaxed">
            {resumir(organizacion.descripcion)}
          </p>
        ) : (
          <p className="text-texto-suave mt-4 text-sm italic">Sin descripción registrada.</p>
        )}

        <span className="text-primario mt-auto pt-4 text-sm font-bold">Ver información →</span>
      </Link>
    </article>
  );
}
