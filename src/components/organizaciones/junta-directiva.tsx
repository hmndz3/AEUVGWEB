import Image from "next/image";

import { inicialesDeNombre } from "@/lib/inicio/consultas-asociacion";
import type { IntegranteJunta } from "@/lib/organizaciones/consultas-organizaciones";
import { cn } from "@/lib/utils";

// Color de respaldo para las iniciales de quien no tenga fotografía cargada.
const ACENTOS = [
  "bg-primario",
  "bg-coral",
  "bg-turquesa",
  "bg-magenta",
  "bg-ambar",
  "bg-cielo",
  "bg-lima",
  "bg-lavanda",
];

export function TarjetaIntegrante({
  integrante,
  indice,
}: {
  integrante: IntegranteJunta;
  indice: number;
}) {
  const acento = ACENTOS[indice % ACENTOS.length];

  return (
    <article className="group border-borde bg-superficie flex flex-col overflow-hidden rounded-[1.25rem] border shadow-sm transition-shadow hover:shadow-lg">
      {/* El retrato viene recortado sobre blanco, así que se funde con la
          tarjeta sin costura visible entre la imagen y el texto. */}
      <div className="bg-superficie relative aspect-3/4 w-full overflow-hidden">
        {integrante.fotoUrl ? (
          <Image
            src={integrante.fotoUrl}
            alt={`Fotografía de ${integrante.nombre}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            unoptimized={integrante.fotoUrl.startsWith("/api/")}
          />
        ) : (
          <span
            aria-hidden
            className={`${acento} grid size-full place-items-center text-5xl font-extrabold text-white`}
          >
            {inicialesDeNombre(integrante.nombre)}
          </span>
        )}
      </div>

      <div className="border-borde flex flex-1 flex-col border-t px-5 py-4">
        <p className="text-texto text-base leading-snug font-bold break-words">
          {integrante.nombre}
        </p>
        <p className="text-primario mt-1 text-sm leading-snug font-semibold">{integrante.cargo}</p>
        {integrante.periodo && (
          <p className="text-texto-suave mt-auto pt-2 text-xs font-medium tracking-wide uppercase">
            Junta Directiva {integrante.periodo}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Junta directiva de una asociación. Es el mismo componente que usa la página
 * institucional de AEUVG desde este sprint: las dos presentan la misma
 * información y mantener dos versiones solo garantizaba que se separaran.
 *
 * No se muestra nada cuando la asociación no tiene integrantes registrados: el
 * dato lo carga AEUVG por partes y un apartado vacío resta más que omitirlo.
 */
export function JuntaDirectiva({
  integrantes,
  titulo = "Junta Directiva",
  descripcion,
  columnas = 4,
}: {
  integrantes: IntegranteJunta[];
  titulo?: string;
  descripcion?: string;
  /** Columnas en escritorio. La página de una asociación es más angosta que la
   *  institucional, y con cuatro columnas los retratos quedaban demasiado
   *  estrechos para leer el cargo sin partirlo en tres líneas. */
  columnas?: 3 | 4;
}) {
  if (integrantes.length === 0) return null;

  return (
    <section>
      <h2 className="text-texto text-2xl font-extrabold tracking-tight">{titulo}</h2>
      {descripcion && (
        <p className="text-texto-suave mt-2 max-w-3xl leading-relaxed">{descripcion}</p>
      )}

      <div
        className={cn(
          "mt-6 grid gap-5 sm:grid-cols-2",
          columnas === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        {integrantes.map((integrante, indice) => (
          <TarjetaIntegrante
            key={integrante.idIntegrante}
            integrante={integrante}
            indice={indice}
          />
        ))}
      </div>
    </section>
  );
}
