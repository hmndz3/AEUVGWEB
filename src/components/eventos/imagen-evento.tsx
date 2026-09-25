import { cn } from "@/lib/utils";

const COLOR_PREDETERMINADO = "#6d4aff";

/**
 * Imagen de un evento, con su marcador cuando todavía no tiene ninguna.
 *
 * Se usa una etiqueta de imagen normal y no el componente optimizado de Next a
 * propósito. Las imágenes de los eventos viven en el servicio externo, que ya
 * las entrega redimensionadas: pasarlas otra vez por el optimizador repetiría
 * ese trabajo y consumiría en Railway un procesamiento que el plan contratado
 * no tiene de sobra. Además, el componente optimizado exige declarar de
 * antemano los dominios permitidos, y aquí la dirección la escribe AEUVG desde
 * el panel, por lo que un dominio no previsto rompería la pantalla.
 */
export function ImagenEvento({
  imagenUrl,
  nombre,
  color,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  modo = "recorte",
}: {
  imagenUrl: string | null;
  nombre: string;
  color: string | null;
  className?: string;
  sizes?: string;
  /**
   * "recorte" llena el espacio y recorta lo que sobra: sirve para las tarjetas,
   * donde todas deben medir igual. "completa" muestra la imagen entera y toma
   * el alto que necesite: es lo que corresponde en el detalle del evento, donde
   * recortar el afiche esconde justo la información que la gente busca.
   */
  modo?: "recorte" | "completa";
}) {
  const fondo = color ?? COLOR_PREDETERMINADO;

  if (modo === "completa" && imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ver el comentario del componente.
      <img
        src={imagenUrl}
        alt={`Imagen del evento ${nombre}`}
        sizes={sizes}
        decoding="async"
        className={cn("bg-superficie-suave h-auto w-full object-contain", className)}
      />
    );
  }

  return (
    <div className={cn("bg-superficie-suave relative overflow-hidden", className)}>
      {imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- ver el comentario del componente.
        <img
          src={imagenUrl}
          alt={`Imagen del evento ${nombre}`}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
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
