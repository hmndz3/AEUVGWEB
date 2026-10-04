"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import type { RedSocialAdministrada } from "@/lib/organizaciones/repositorio-organizaciones";
import type { TipoOrganizacion } from "@/validators/organizacion-admin";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

const PLATAFORMAS_SUGERIDAS = ["Instagram", "Facebook", "TikTok", "X", "LinkedIn", "YouTube"];

/**
 * Redes sociales de una asociación o de un club desde el panel.
 *
 * Los enlaces se agregan y se quitan, no se editan: son un par de plataforma y
 * dirección, y corregirlos equivale a reemplazarlos. Solo se aceptan enlaces
 * http y https, lo mismo que valida el servidor.
 */
export function EditorRedesSociales({
  tipo,
  id,
  redes,
}: {
  tipo: TipoOrganizacion;
  id: number;
  redes: RedSocialAdministrada[];
}) {
  const router = useRouter();
  const [plataforma, setPlataforma] = useState("");
  const [url, setUrl] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const base = `/api/admin/organizaciones/${tipo}/${id}/redes`;

  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setMensaje(null);

    try {
      const respuesta = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plataforma, url }),
      });

      if (respuesta.ok) {
        setPlataforma("");
        setUrl("");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores) setErrores(cuerpo.errores);
      else setMensaje(cuerpo.mensaje ?? "No se pudo guardar el enlace.");
    } catch {
      setMensaje("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(idRedSocial: number) {
    if (!window.confirm("El enlace dejará de aparecer en el sitio. ¿Continuar?")) return;

    setMensaje(null);

    try {
      const respuesta = await fetch(`${base}/${idRedSocial}`, { method: "DELETE" });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setMensaje(cuerpo.mensaje ?? "No se pudo quitar el enlace.");
        return;
      }

      router.refresh();
    } catch {
      setMensaje("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-xl font-bold">Redes sociales</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Aparecen como botones en el bloque de contacto de la página. Se aceptan enlaces que
          empiecen con http:// o https://.
        </p>
      </div>

      {mensaje && <Alerta tipo="error">{mensaje}</Alerta>}

      {redes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {redes.map((red) => (
            <li
              key={red.idRedSocial}
              className="border-borde bg-superficie flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-texto text-sm font-semibold">{red.plataforma}</p>
                <p className="text-texto-suave truncate text-xs">{red.url}</p>
              </div>
              <Boton
                type="button"
                tamano="sm"
                variante="destructivo"
                onClick={() => quitar(red.idRedSocial)}
              >
                Quitar
              </Boton>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={agregar}
        noValidate
        className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="red-plataforma" className="text-texto text-sm font-semibold">
              Plataforma
            </label>
            <input
              id="red-plataforma"
              list="plataformas-sugeridas"
              value={plataforma}
              onChange={(evento) => setPlataforma(evento.target.value)}
              maxLength={50}
              className={claseCampo}
            />
            <datalist id="plataformas-sugeridas">
              {PLATAFORMAS_SUGERIDAS.map((nombre) => (
                <option key={nombre} value={nombre} />
              ))}
            </datalist>
            {errores.plataforma && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.plataforma}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="red-url" className="text-texto text-sm font-semibold">
              Enlace
            </label>
            <input
              id="red-url"
              value={url}
              onChange={(evento) => setUrl(evento.target.value)}
              maxLength={500}
              placeholder="https://instagram.com/ejemplo"
              className={claseCampo}
            />
            {errores.url && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.url}
              </p>
            )}
          </div>
        </div>

        <div>
          <Boton type="submit" tamano="sm" cargando={guardando}>
            Agregar enlace
          </Boton>
        </div>
      </form>
    </section>
  );
}
