"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Ficha pública del tutor.
 *
 * Es lo que el estudiantado lee antes de elegirlo, así que son los dos únicos
 * campos que el propio tutor controla: cómo se presenta y por dónde
 * contactarlo. El resto de su ficha —nombre, carrera, cursos— sale de su
 * cuenta y de la postulación que AEUVG aprobó, y no se edita desde aquí.
 */
export function FormularioFichaTutor({
  descripcion: descripcionInicial,
  informacionContacto: contactoInicial,
}: {
  descripcion: string | null;
  informacionContacto: string | null;
}) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? "");
  const [informacionContacto, setInformacionContacto] = useState(contactoInicial ?? "");
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const respuesta = await fetch("/api/tutorias/ficha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, informacionContacto }),
      });

      if (respuesta.ok) {
        setMensaje({ tipo: "exito", texto: "Tu ficha quedó actualizada." });
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setMensaje({
        tipo: "error",
        texto:
          Object.values(cuerpo.errores ?? {})[0] ??
          cuerpo.mensaje ??
          "No se pudo guardar la ficha.",
      });
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {mensaje && (
        <Alerta tipo={mensaje.tipo === "exito" ? "exito" : "error"}>{mensaje.texto}</Alerta>
      )}

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="descripcion">Cómo te presentas</EtiquetaCampo>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Qué te gusta explicar, cómo das las tutorías, en qué te especializas."
          className={claseCampo}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="informacionContacto">Cómo contactarte</EtiquetaCampo>
        <textarea
          id="informacionContacto"
          value={informacionContacto}
          onChange={(evento) => setInformacionContacto(evento.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Un correo o un teléfono, por si alguien necesita escribirte antes."
          className={claseCampo}
        />
        <p className="text-texto-suave text-xs">
          Esto se ve en tu ficha pública. No pongas nada que no quieras que vea cualquiera.
        </p>
      </div>

      <div>
        <Boton type="submit" cargando={guardando}>
          Guardar ficha
        </Boton>
      </div>
    </form>
  );
}
