import Link from "next/link";

/**
 * Lo que se muestra cuando no hay eventos que listar. Se separa del listado
 * porque el vacío tiene dos causas distintas y el mensaje no puede ser el
 * mismo: que AEUVG todavía no publique nada, o que los filtros no dejen pasar
 * ningún evento.
 */
export function EstadoVacioEventos({
  titulo,
  mensaje,
  accion,
}: {
  titulo: string;
  mensaje: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-16 text-center">
      <p className="text-texto text-lg font-bold">{titulo}</p>
      <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">{mensaje}</p>

      {accion && (
        <Link
          href={accion.href}
          className="bg-primario hover:bg-primario-fuerte mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white transition-colors"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  );
}
