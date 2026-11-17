import { inicialesDe } from "@/lib/auth/usuario-sesion-cliente";

/**
 * Avatar de una persona.
 *
 * Usa su fotografía cuando la tiene y sus iniciales cuando no. La foto es
 * opcional, así que las iniciales no son un respaldo temporal: son el caso
 * habitual, y son lo que la plataforma ha mostrado desde el Sprint 1.
 *
 * Vive en los componentes comunes porque lo usan el perfil, el encabezado, el
 * directorio de tutores y el panel: antes cada uno repetía el mismo círculo
 * con iniciales y se iban separando entre sí.
 */
export function Avatar({
  nombre,
  fotoUrl,
  tamano = "size-10",
}: {
  nombre: string;
  fotoUrl?: string | null;
  /** Clases de tamaño y de tipografía, para adaptarlo a cada sitio. */
  tamano?: string;
}) {
  if (fotoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- la imagen la
         sirve la propia plataforma desde su volumen; no pasa por el
         optimizador porque su host depende del ambiente. */
      <img
        src={fotoUrl}
        alt={`Fotografía de ${nombre}`}
        className={`${tamano} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${tamano} bg-primario grid shrink-0 place-items-center rounded-full font-bold text-white`}
    >
      {inicialesDe(nombre)}
    </span>
  );
}
