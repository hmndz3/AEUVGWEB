"use client";

import { useState } from "react";

import { Icono } from "@/components/autenticacion/icono";
import { cn } from "@/lib/utils";

type CampoAccesoProps = React.ComponentProps<"input"> & {
  etiqueta: string;
  icono: React.ComponentProps<typeof Icono>["nombre"];
  ayuda?: string;
  textoLateral?: string;
  error?: string;
  botonFinal?: boolean;
};

export function CampoAcceso({
  etiqueta,
  icono,
  ayuda,
  textoLateral,
  error,
  botonFinal = false,
  id,
  className,
  type = "text",
  ...props
}: CampoAccesoProps) {
  const idCampo = id ?? props.name;
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const esContrasena = type === "password" && botonFinal;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={idCampo} className="text-texto text-sm font-semibold">
          {etiqueta}
        </label>
        {textoLateral && (
          <span className={cn("text-xs font-bold", error ? "text-error" : "text-turquesa")}>
            {textoLateral}
          </span>
        )}
      </div>
      <div className="relative flex items-center">
        <Icono
          nombre={icono}
          className={cn(
            "pointer-events-none absolute left-3.5 size-5",
            error ? "text-error" : "text-texto-suave"
          )}
        />
        <input
          id={idCampo}
          type={esContrasena && contrasenaVisible ? "text" : type}
          aria-invalid={Boolean(error)}
          className={cn(
            "border-borde bg-superficie text-texto placeholder:text-texto-suave h-12 w-full rounded-xl border py-3 pr-11 pl-11 text-sm shadow-sm transition outline-none",
            "focus:border-primario focus:ring-primario/20 focus:ring-4",
            error && "border-error bg-error/5 focus:border-error focus:ring-error/15",
            className
          )}
          {...props}
        />
        {esContrasena && (
          <button
            type="button"
            aria-label={contrasenaVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={contrasenaVisible}
            onClick={() => setContrasenaVisible((visible) => !visible)}
            className="text-texto-suave hover:text-texto absolute right-2 rounded-full p-2 transition-colors"
          >
            <Icono nombre="ojo" className="size-5" />
          </button>
        )}
        {error && !botonFinal && (
          <Icono nombre="informacion" className="text-error absolute right-3.5 size-5" />
        )}
      </div>
      {error ? (
        <p className="text-error flex items-center gap-1.5 text-xs font-semibold">
          <Icono nombre="informacion" className="size-4 shrink-0" />
          {error}
        </p>
      ) : (
        ayuda && <p className="text-texto-suave text-xs leading-relaxed">{ayuda}</p>
      )}
    </div>
  );
}
