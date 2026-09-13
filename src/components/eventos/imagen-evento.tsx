import Image from "next/image";

import { cn } from "@/lib/utils";

const COLOR_PREDETERMINADO = "#6d4aff";

/**
 * Imagen de un evento, con su marcador cuando todavía no tiene ninguna.
 *
 * Se usa `unoptimized` a propósito: las imágenes de los eventos viven en el
 * servicio de imágenes externo, que ya las entrega redimensionadas. Pasarlas
 * otra vez por el optimizador de Next repetiría ese trabajo y consumiría en
 * Railway un procesamiento que el plan contratado no tiene de sobra.
 */
export function ImagenEvento({
  imagenUrl,
  nombre,
  color,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  imagenUrl: string | null;
  nombre: string;
  color: string | null;
  className?: string;
  sizes?: string;
}) {
  const fondo = color ?? COLOR_PREDETERMINADO;

  return (
    <div className={cn("bg-superficie-suave relative overflow-hidden", className)}>
      {imagenUrl ? (
        <Image
          src={imagenUrl}
          alt={`Imagen del evento ${nombre}`}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          // El marcador usa el color de la categoría, de modo que un evento sin
          // imagen siga siendo reconocible y no se vea como un espacio roto.
          style={{ background: `linear-gradient(135deg, ${fondo} 0%, ${fondo}55 100%)` }}
        />
      )}
    </div>
  );
}
