import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-borde bg-superficie rounded-[1.25rem] border p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function TarjetaTitulo({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-texto text-lg font-bold", className)} {...props} />;
}

export function TarjetaTexto({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-texto-suave text-sm", className)} {...props} />;
}
