import { cn } from "@/lib/utils";

/**
 * Asterisco rojo que marca un campo obligatorio. Es la convención que el
 * estudiantado ya conoce de otros formularios, así que se usa en todos los del
 * sitio en lugar de escribir "(obligatorio)" junto a cada etiqueta.
 *
 * Se oculta a los lectores de pantalla: ellos anuncian el campo como requerido
 * por el atributo required (o aria-required) del propio control, y leer además
 * "asterisco" solo añadiría ruido.
 */
export function MarcaObligatorio() {
  return (
    <span aria-hidden className="text-error ml-0.5 font-bold">
      *
    </span>
  );
}

/** Etiqueta de un campo de formulario, con su asterisco cuando es obligatorio. */
export function EtiquetaCampo({
  htmlFor,
  obligatorio = false,
  className,
  children,
}: {
  htmlFor?: string;
  obligatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-texto text-sm font-semibold", className)}>
      {children}
      {obligatorio && <MarcaObligatorio />}
    </label>
  );
}

/** Aviso que explica el asterisco. Va al inicio de cada formulario que lo usa. */
export function NotaCamposObligatorios({ className }: { className?: string }) {
  return (
    <p className={cn("text-texto-suave text-xs", className)}>
      {/* Aquí el asterisco sí se lee: sin él la frase pierde su sentido. */}
      Los campos marcados con <span className="text-error font-bold">*</span> son obligatorios.
    </p>
  );
}
