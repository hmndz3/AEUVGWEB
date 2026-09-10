import { Tarjeta } from "@/components/ui/tarjeta";

/**
 * Marcador de una sección del panel cuyo módulo se implementa en un sprint
 * posterior. Deja explícito qué falta en lugar de mostrar una pantalla en blanco.
 */
export function SeccionVacia({
  titulo,
  descripcion,
  sprint,
}: {
  titulo: string;
  descripcion: string;
  sprint: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">{descripcion}</p>
      </div>

      <Tarjeta className="border-dashed">
        <p className="text-texto text-sm font-bold">Módulo pendiente</p>
        <p className="text-texto-suave mt-2 text-sm leading-relaxed">
          Esta sección quedó habilitada en la estructura del panel. Su funcionalidad se implementa
          en el {sprint}.
        </p>
      </Tarjeta>
    </div>
  );
}
