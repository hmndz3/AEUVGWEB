import { cn } from "@/lib/utils";

/**
 * Bloque de texto de la página de una organización. No se muestra cuando el
 * campo viene vacío: AEUVG carga la información de cada asociación por partes y
 * un apartado con un "pendiente" dentro resta más que omitirlo.
 */
export function BloqueTexto({
  titulo,
  texto,
  className,
}: {
  titulo: string;
  texto: string | null;
  className?: string;
}) {
  if (!texto) return null;

  return (
    <section className={cn("rounded-[1.25rem] p-8", className)}>
      <h2 className="text-texto text-xl font-extrabold">{titulo}</h2>
      <p className="text-texto-suave mt-3 leading-relaxed whitespace-pre-line">{texto}</p>
    </section>
  );
}
