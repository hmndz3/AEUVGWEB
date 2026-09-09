import { cn } from "@/lib/utils";

type VarianteBoton = "primario" | "secundario" | "contorno" | "texto" | "destructivo";
type TamanoBoton = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-primario text-white hover:bg-primario-fuerte shadow-sm hover:shadow",
  secundario: "bg-coral text-white hover:brightness-95 shadow-sm hover:shadow",
  contorno: "border border-borde bg-superficie text-texto hover:bg-superficie-suave",
  texto: "text-primario hover:bg-primario-suave",
  destructivo: "bg-error text-white hover:brightness-95 shadow-sm",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

type PropsBoton = React.ComponentProps<"button"> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
};

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  disabled,
  className,
  children,
  ...props
}: PropsBoton) {
  return (
    <button
      disabled={disabled || cargando}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
        "focus-visible:ring-primario focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTES[variante],
        TAMANOS[tamano],
        className
      )}
      {...props}
    >
      {cargando && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
