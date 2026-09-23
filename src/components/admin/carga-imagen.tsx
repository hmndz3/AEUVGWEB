"use client";

import { useRef, useState } from "react";

import { Boton } from "@/components/ui/boton";
import { TIPOS_PERMITIDOS } from "@/lib/imagenes/validacion-imagen";

/**
 * Subida de la imagen de un evento.
 *
 * El campo de dirección sigue siendo la fuente de verdad: la subida solo lo
 * rellena. Así, si el servicio de imágenes no está configurado en el ambiente,
 * el administrador todavía puede pegar la dirección de una imagen externa y
 * publicar el evento igual.
 */
export function CargaImagen({
  valor,
  onCambio,
  onError,
}: {
  valor: string;
  onCambio: (url: string) => void;
  onError: (mensaje: string | null) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function subir(archivo: File) {
    setSubiendo(true);
    onError(null);

    try {
      const cuerpo = new FormData();
      cuerpo.append("imagen", archivo);

      const respuesta = await fetch("/api/admin/eventos/imagen", { method: "POST", body: cuerpo });
      const datos = (await respuesta.json().catch(() => ({}))) as {
        url?: string;
        mensaje?: string;
      };

      if (respuesta.ok && datos.url) {
        onCambio(datos.url);
        return;
      }

      onError(datos.mensaje ?? "No se pudo subir la imagen.");
    } catch {
      onError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={entrada}
        type="file"
        accept={TIPOS_PERMITIDOS.join(",")}
        className="hidden"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          if (archivo) void subir(archivo);
        }}
      />

      <Boton
        type="button"
        variante="contorno"
        tamano="sm"
        cargando={subiendo}
        onClick={() => entrada.current?.click()}
      >
        Subir imagen
      </Boton>

      {valor && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa
              de una dirección que el administrador acaba de escribir o subir;
              no pasa por el optimizador porque el host todavía no se conoce. */}
          <img
            src={valor}
            alt="Vista previa de la imagen del evento"
            className="border-borde h-16 w-24 rounded-xl border object-cover"
          />
          <Boton type="button" variante="texto" tamano="sm" onClick={() => onCambio("")}>
            Quitar
          </Boton>
        </>
      )}
    </div>
  );
}
