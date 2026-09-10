import { cn } from "@/lib/utils";

type Tono = "pendiente" | "acreditada" | "neutro" | "informativo" | "error";

const TONOS: Record<Tono, string> = {
  // Los estados de horas beca conservan el mismo color en toda la plataforma.
  pendiente: "bg-ambar/15 text-[#8a5600]",
  acreditada: "bg-turquesa/15 text-[#00695a]",
  neutro: "bg-superficie-suave text-texto-suave",
  informativo: "bg-primario-suave text-primario-fuerte",
  error: "bg-error/15 text-error",
};

export function EtiquetaEstado({
  tono = "neutro",
  className,
  ...props
}: React.ComponentProps<"span"> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        TONOS[tono],
        className
      )}
      {...props}
    />
  );
}
