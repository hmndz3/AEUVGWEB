import { cn } from "@/lib/utils";

type PropsCampo = React.ComponentProps<"input"> & {
  etiqueta: string;
  ayuda?: string;
  error?: string;
};

/** Campo de formulario con etiqueta, texto de ayuda y estado de error. */
export function Campo({ etiqueta, ayuda, error, id, className, ...props }: PropsCampo) {
  const idCampo = id ?? props.name;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-texto text-sm font-semibold">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        aria-invalid={Boolean(error)}
        aria-describedby={cn(idAyuda, idError) || undefined}
        className={cn(
          "border-borde bg-superficie text-texto placeholder:text-texto-suave h-11 rounded-2xl border px-4 text-sm",
          "focus:border-primario focus:ring-primario/30 focus:ring-2 focus:outline-none",
          error && "border-error focus:border-error focus:ring-error/30",
          className
        )}
        {...props}
      />
      {ayuda && !error && (
        <p id={idAyuda} className="text-texto-suave text-xs">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-error text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
