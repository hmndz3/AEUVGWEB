"use client";

import Link from "next/link";
import { useState } from "react";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";
import { IndicadorSeguridadContrasena } from "@/components/autenticacion/indicador-seguridad-contrasena";

type Estado =
  | { fase: "inicial" }
  | { fase: "enviando" }
  | { fase: "lista" }
  | { fase: "error"; mensaje: string; errores?: Record<string, string> };

type RespuestaError = {
  mensaje?: string;
  errores?: { campo: string; mensaje: string }[];
};

export function FormularioRestablecer({ token }: { token: string }) {
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado({ fase: "enviando" });

    try {
      const respuesta = await fetch("/api/auth/restablecer-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, contrasena, confirmarContrasena }),
      });

      if (respuesta.ok) {
        setEstado({ fase: "lista" });
        return;
      }

      const cuerpo = (await respuesta.json()) as RespuestaError;
      const errores = Object.fromEntries(
        (cuerpo.errores ?? []).map((problema) => [problema.campo, problema.mensaje])
      );

      setEstado({
        fase: "error",
        mensaje: cuerpo.mensaje ?? "No se pudo actualizar la contraseña.",
        errores,
      });
    } catch {
      setEstado({
        fase: "error",
        mensaje: "No se pudo conectar con el servidor. Intenta de nuevo.",
      });
    }
  }

  if (estado.fase === "lista") {
    return (
      <div
        role="status"
        className="bg-exito/10 border-exito/30 mt-8 max-w-xl rounded-2xl border p-6"
      >
        <p className="text-texto flex items-center gap-2 text-sm font-bold">
          <Icono nombre="verificado" className="size-5" /> Contraseña actualizada
        </p>
        <p className="text-texto-suave mt-2 text-sm leading-relaxed">
          Ya puedes iniciar sesión con tu contraseña nueva.
        </p>
        <Link
          href="/iniciar-sesion"
          className="bg-primario hover:bg-primario-fuerte mt-5 inline-flex h-11 items-center rounded-xl px-6 text-sm font-bold text-white transition-colors"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  const errores = estado.fase === "error" ? (estado.errores ?? {}) : {};

  return (
    <form className="mt-8 max-w-xl" onSubmit={manejarEnvio} noValidate>
      <div className="flex flex-col gap-5">
        <div>
          <CampoAcceso
            id="contrasena-nueva"
            name="contrasena"
            etiqueta="Contraseña nueva"
            icono="candado"
            type="password"
            botonFinal
            required
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            error={errores.contrasena}
          />
          <div className="mt-3">
            <IndicadorSeguridadContrasena contrasena={contrasena} />
          </div>
        </div>

        <CampoAcceso
          id="confirmar-contrasena-nueva"
          name="confirmarContrasena"
          etiqueta="Confirmar contraseña"
          icono="candado"
          type="password"
          botonFinal
          required
          value={confirmarContrasena}
          onChange={(evento) => setConfirmarContrasena(evento.target.value)}
          error={errores.confirmarContrasena}
        />
      </div>

      {estado.fase === "error" && (
        <p role="alert" className="text-error mt-4 text-sm font-medium">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={estado.fase === "enviando"}
        className="bg-primario hover:bg-primario-fuerte mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors disabled:opacity-60"
      >
        {estado.fase === "enviando" ? (
          "Guardando…"
        ) : (
          <>
            Guardar contraseña nueva <Icono nombre="flecha" />
          </>
        )}
      </button>
    </form>
  );
}
