"use client";

import { FormEvent, useState } from "react";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";
import { PanelVerificacion } from "@/components/autenticacion/panel-verificacion";

export default function PaginaReenviarVerificacion() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function reenviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/auth/reenviar-verificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      const resultado = (await respuesta.json()) as { mensaje: string };
      setMensaje(resultado.mensaje);
    } catch {
      setMensaje(
        "Si existe una cuenta pendiente para ese correo, recibirás un nuevo enlace cuando el límite de seguridad lo permita."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso panel={<PanelVerificacion />}>
      <div className="flex min-h-[430px] max-w-xl flex-col justify-center">
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Reenviar verificación</h1>
        <p className="text-texto-suave mt-3 text-sm leading-relaxed">
          Ingresa el correo institucional con el que creaste tu cuenta. Por seguridad, siempre
          mostraremos la misma confirmación.
        </p>
        <form className="mt-7 grid gap-5" onSubmit={reenviar}>
          <CampoAcceso
            id="correo"
            name="correo"
            etiqueta="Correo institucional UVG"
            icono="at"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            required
          />
          <button
            type="submit"
            disabled={enviando}
            className="bg-primario hover:bg-primario-fuerte disabled:bg-texto-suave flex h-12 items-center justify-center rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed"
          >
            {enviando ? "Procesando…" : "Enviar enlace de verificación"}
          </button>
        </form>
        {mensaje && (
          <p className="bg-superficie-suave text-texto mt-5 rounded-xl p-4 text-sm" role="status">
            {mensaje}
          </p>
        )}
      </div>
    </MarcoAcceso>
  );
}
