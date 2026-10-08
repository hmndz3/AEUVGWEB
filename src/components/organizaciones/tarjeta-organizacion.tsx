import Link from "next/link";

import { inicialesDeNombre } from "@/lib/inicio/consultas-asociacion";
import type { OrganizacionResumen } from "@/lib/organizaciones/consultas-organizaciones";
import { nombreCorto } from "@/lib/organizaciones/nombre-organizacion";
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
 * Portada de la tarjeta. A diferencia de la de un evento, que es un afiche y se
 * recorta para llenar el espacio, aquí casi siempre se trata de un logotipo:
 * recortarlo le quitaría justo los bordes. Se muestra completo y, detrás, la
 * misma imagen ampliada y desenfocada llena la franja, de modo que todas las
 * tarjetas midan igual sin dejar bandas vacías alrededor del logotipo.
 *
 * Se usa la etiqueta de imagen normal por las mismas razones que en la imagen
 * de los eventos (ver src/components/eventos/imagen-evento.tsx); el navegador
 * descarga la imagen una sola vez aunque aparezca dos veces.
 */
function PortadaOrganizacion({
  imagenUrl,
  nombre,
  titulo,
}: {
  imagenUrl: string | null;
  nombre: string;
  titulo: string;
}) {
  if (!imagenUrl) {
    return (
      <div
        aria-hidden
        className="from-primario to-lavanda grid h-40 w-full place-items-center bg-linear-to-br px-6"
      >
        {/* Sin imagen se presentan las siglas, o las iniciales si no hay, para
            que la tarjeta siga siendo reconocible y no parezca un espacio roto. */}
        <span className="text-center text-3xl font-extrabold tracking-tight break-all text-white">
          {titulo === nombre ? inicialesDeNombre(nombre) : titulo}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-superficie-suave relative h-40 w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- ver el comentario del componente. */}
      <img
        src={imagenUrl}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- ver el comentario del componente. */}
      <img
        src={imagenUrl}
        alt={`Logotipo de ${nombre}`}
        loading="lazy"
        decoding="async"
        // text-transparent: si el enlace deja de funcionar, el navegador pinta
        // el texto alternativo sobre la franja; así queda solo el fondo, y los
        // lectores de pantalla lo siguen leyendo.
        className="relative size-full object-contain p-4 text-transparent drop-shadow-md"
      />
    </div>
  );
}

/**
 * Tarjeta de una asociación o de un club. Es el mismo componente en las dos
 * secciones: un grupo estudiantil se presenta igual sea del tipo que sea, y una
 * sola tarjeta evita que las dos rejillas se separen visualmente con el tiempo.
 *
 * Sigue la forma de la tarjeta de evento (imagen arriba, datos abajo) porque es
 * la que el estudiantado ya reconoce en el sitio. El título es el nombre corto,
 * que es como se conoce a cada asociación, y debajo va el nombre completo.
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
  const titulo = nombreCorto(organizacion);

  return (
    <article className={cn("h-full", className)}>
      <Link
        href={`${ruta}/${organizacion.id}`}
        className={cn(
          "border-borde bg-superficie flex h-full flex-col overflow-hidden rounded-[1.25rem] border shadow-sm",
          "focus-visible:ring-primario transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
        )}
      >
        <PortadaOrganizacion
          imagenUrl={organizacion.imagenUrl}
          nombre={organizacion.nombre}
          titulo={titulo}
        />

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-texto text-lg leading-snug font-bold break-words">{titulo}</h3>
          {organizacion.siglas && (
            <p className="text-texto-suave mt-1 text-sm leading-snug font-semibold break-words">
              {organizacion.nombre}
            </p>
          )}

          {organizacion.descripcion ? (
            <p className="text-texto-suave mt-3 text-sm leading-relaxed">
              {resumir(organizacion.descripcion)}
            </p>
          ) : (
            <p className="text-texto-suave mt-3 text-sm italic">Sin descripción registrada.</p>
          )}

          <div className="mt-auto pt-4">
            <span className="border-borde text-primario block border-t pt-3 text-sm font-bold">
              Ver información →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
