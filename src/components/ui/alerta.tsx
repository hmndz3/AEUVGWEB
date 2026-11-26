import { cn } from "@/lib/utils";

type TipoAlerta = "exito" | "advertencia" | "error" | "informativo";

const TIPOS: Record<TipoAlerta, string> = {
  exito: "bg-exito/10 border-exito/30 text-sobre-turquesa",
  advertencia: "bg-advertencia/10 border-advertencia/30 text-sobre-ambar",
  error: "bg-error/10 border-error/30 text-sobre-coral",
  informativo: "bg-informativo/10 border-informativo/30 text-sobre-cielo",
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
