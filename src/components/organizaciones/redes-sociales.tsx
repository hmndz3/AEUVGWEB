import { cn } from "@/lib/utils";

export type RedSocialEnlace = { idRedSocial?: number; plataforma: string; url: string };

/**
 * Enlaces a las redes de una organización. Apuntan fuera del sitio, así que se
 * abren en otra pestaña y con rel="noreferrer" para no filtrar la página de
 * origen ni dejar que el destino manipule la ventana que lo abrió.
 *
 * Se descartan en la presentación los enlaces que no sean http o https: la
 * validación del panel ya los rechaza, pero la base conserva lo que se cargó
 * antes de este sprint y un javascript: en un enlace no debe llegar a pintarse.
 */
export function RedesSociales({
  redes,
  className,
  tono = "claro",
}: {
  redes: readonly RedSocialEnlace[];
  className?: string;
  tono?: "claro" | "oscuro";
}) {
  const seguras = redes.filter((red) => /^https?:\/\//i.test(red.url));

  if (seguras.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {seguras.map((red) => (
        <li key={red.idRedSocial ?? `${red.plataforma}-${red.url}`}>
          <a
            href={red.url}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors",
              tono === "claro"
                ? "border-borde bg-superficie text-texto hover:bg-superficie-suave border"
                : "border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            {red.plataforma}
          </a>
        </li>
      ))}
    </ul>
  );
}
