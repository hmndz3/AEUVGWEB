import { cn } from "@/lib/utils";

type TipoAlerta = "exito" | "advertencia" | "error" | "informativo";

const TIPOS: Record<TipoAlerta, string> = {
  exito: "bg-exito/10 border-exito/30 text-[#0b6f4a]",
  advertencia: "bg-advertencia/10 border-advertencia/30 text-[#8a5600]",
  error: "bg-error/10 border-error/30 text-[#a3132a]",
  informativo: "bg-informativo/10 border-informativo/30 text-[#1a6ab0]",
};

export function Alerta({
  tipo = "informativo",
  titulo,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tipo?: TipoAlerta; titulo?: string }) {
  return (
    <div
      role="status"
      className={cn("rounded-2xl border px-4 py-3 text-sm", TIPOS[tipo], className)}
      {...props}
    >
      {titulo && <p className="font-semibold">{titulo}</p>}
      {children}
    </div>
  );
}
