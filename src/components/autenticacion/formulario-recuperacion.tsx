"use client";

import { useState } from "react";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";

type Estado =
  | { fase: "inicial" }
  | { fase: "enviando" }
  | { fase: "enviado"; mensaje: string }
  | { fase: "error"; mensaje: string };

export function FormularioRecuperacion({ dominioInstitucional }: { dominioInstitucional: string }) {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado({ fase: "enviando" });

    try {
      const respuesta = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      const cuerpo = (await respuesta.json()) as { mensaje?: string };

      setEstado({
        fase: "enviado",
        mensaje: cuerpo.mensaje ?? "Revisa tu correo institucional.",
      });
    } catch {
      setEstado({
        fase: "error",
        mensaje: "No se pudo enviar la solicitud. Revisa tu conexión e intenta de nuevo.",
      });
    }
  }

  if (estado.fase === "enviado") {
    return (
      <div
        role="status"
        className="bg-exito/10 border-exito/30 mt-8 max-w-xl rounded-2xl border p-6"
      >
        <p className="text-texto flex items-center gap-2 text-sm font-bold">
          <Icono nombre="verificado" className="size-5" /> Solicitud recibida
        </p>
        <p className="text-texto-suave mt-2 text-sm leading-relaxed">{estado.mensaje}</p>
        <button
          type="button"
          onClick={() => setEstado({ fase: "inicial" })}
          className="text-primario mt-4 text-sm font-semibold hover:underline"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <form className="mt-8 max-w-xl" onSubmit={manejarEnvio} noValidate>
      <CampoAcceso
        id="correo-recuperacion"
        name="correo"
        etiqueta="Correo institucional UVG"
        icono="at"
        textoLateral={`Terminación @${dominioInstitucional}`}
        type="email"
        required
        value={correo}
        onChange={(evento) => setCorreo(evento.target.value)}
        placeholder={`estudiante@${dominioInstitucional}`}
        ayuda="Debe ser la dirección oficial proporcionada por la universidad."
      />

      {estado.fase === "error" && (
        <p role="alert" className="text-error mt-3 text-sm font-medium">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={estado.fase === "enviando"}
        className="bg-primario hover:bg-primario-fuerte mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors disabled:opacity-60"
      >
        {estado.fase === "enviando" ? (
          "Enviando…"
        ) : (
          <>
            Enviar enlace de recuperación <Icono nombre="flecha" />
          </>
        )}
      </button>
    </form>
  );
}
