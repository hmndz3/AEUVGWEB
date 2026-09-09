import { cn } from "@/lib/utils";

/** Contenedor de tabla. El desplazamiento horizontal evita que la página se desborde en móvil. */
export function Tabla({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="border-borde bg-superficie overflow-x-auto rounded-[1.25rem] border">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function TablaEncabezado({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("bg-superficie-suave text-texto-suave text-xs uppercase", className)}
      {...props}
    />
  );
}

export function TablaCuerpo(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TablaFila({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-borde hover:bg-superficie-suave/60 border-t transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function TablaCelda({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}

export function TablaCeldaEncabezado({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("px-4 py-3 font-semibold tracking-wide", className)} {...props} />;
}
