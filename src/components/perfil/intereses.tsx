"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { MAXIMO_INTERESES } from "@/lib/personalizacion/intereses";

export type CategoriaInteres = {
  idCategoriaEvento: number;
  nombre: string;
  /** El color del catálogo es opcional; sin él, el punto toma el del tema. */
  color: string | null;
};

/**
 * Categorías de evento que le interesan al estudiante.
 *
 * Se elige con casillas y no con un selector múltiple porque son pocas y hay
 * que verlas todas a la vez para decidir: un selector obligaría a abrirlo y
 * recorrerlo para saber qué hay.
 *
 * No marcar ninguna es una opción válida: significa no recibir
 * recomendaciones, y la pantalla lo dice en lugar de insistir.
 */
export function InteresesPerfil({
  categorias,
  elegidas: elegidasIniciales,
}: {
  categorias: CategoriaInteres[];
  elegidas: number[];
}) {
  const router = useRouter();
  const [elegidas, setElegidas] = useState<number[]>(elegidasIniciales);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const alternar = (id: number) =>
    setElegidas((previas) =>
      previas.includes(id) ? previas.filter((valor) => valor !== id) : [...previas, id]
    );

  async function guardar() {
    setGuardando(true);
    setMensaje(null);

    try {
      const respuesta = await fetch("/api/perfil/intereses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorias: elegidas }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setMensaje({
          tipo: "error",
          texto: cuerpo.mensaje ?? "No se pudieron guardar tus intereses.",
        });
        return;
      }

      setMensaje({ tipo: "exito", texto: "Listo. Tus recomendaciones ya se ajustaron." });
      router.refresh();
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-lg font-bold">Lo que me interesa</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Marca los tipos de actividad que te gustaría que te avisemos. Con esto armamos las
          recomendaciones de tu perfil. Si no marcas ninguna, no te recomendamos nada.
        </p>
      </div>

      {mensaje && (
        <Alerta tipo={mensaje.tipo === "exito" ? "exito" : "error"}>{mensaje.texto}</Alerta>
      )}

      <div className="flex flex-wrap gap-2">
        {categorias.map((categoria) => {
          const marcada = elegidas.includes(categoria.idCategoriaEvento);
          const alTope = !marcada && elegidas.length >= MAXIMO_INTERESES;

          return (
            <label
              key={categoria.idCategoriaEvento}
              className={`border-borde inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                marcada
                  ? "border-primario bg-primario-suave text-sobre-lavanda"
                  : "bg-superficie text-texto-suave"
              } ${alTope ? "cursor-not-allowed opacity-50" : "hover:bg-superficie-suave"}`}
            >
              <input
                type="checkbox"
                checked={marcada}
                disabled={alTope}
                onChange={() => alternar(categoria.idCategoriaEvento)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: categoria.color ?? "currentColor" }}
              />
              {categoria.nombre}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="button" variante="contorno" cargando={guardando} onClick={guardar}>
          Guardar mis intereses
        </Boton>
        <p className="text-texto-suave text-xs">
          {elegidas.length === 0
            ? "Ninguna marcada"
            : `${elegidas.length} de ${MAXIMO_INTERESES} marcadas`}
        </p>
      </div>
    </section>
  );
}
