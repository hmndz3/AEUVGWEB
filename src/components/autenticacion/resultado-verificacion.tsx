"use client";

import Link from "next/link";
import { useState } from "react";

import { Icono } from "@/components/ui/icono";

type Estado = "pendiente" | "verificando" | "correcto" | "invalido" | "error";

/**
 * Confirmación del correo institucional.
 *
 * La cuenta se activa al pulsar el botón y no al abrir la página. Los filtros
 * de correo de UVG (Microsoft Defender) abren cada enlace para analizarlo antes
 * de entregar el mensaje, y cuando la página verificaba sola al cargar, ese
 * análisis activaba la cuenta aunque el mensaje quedara en cuarentena y su
 * dueño nunca lo viera. Con eso cualquiera podía registrar el correo y el
 * carnet de otro estudiante. Los analizadores abren enlaces, pero no pulsan
 * botones.
 */
export function ResultadoVerificacion({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>(token ? "pendiente" : "invalido");

  async function confirmar() {
    setEstado("verificando");

    try {
      const respuesta = await fetch("/api/auth/verificar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      setEstado(respuesta.ok ? "correcto" : "invalido");
      // El token ya no sirve: se retira de la barra de direcciones y del
      // historial para que no quede a la vista ni se reenvíe al recargar.
      if (respuesta.ok) window.history.replaceState(null, "", "/verificar-correo");
    } catch {
      setEstado("error");
    }
  }

  const contenido = {
    pendiente: {
      titulo: "Confirma tu correo institucional",
      mensaje:
        "Pulsa el botón para activar tu cuenta de AEUVG. Si no creaste una cuenta, ignora este enlace y no se activará.",
      icono: "escudo" as const,
    },
    verificando: {
      titulo: "Verificando tu cuenta…",
      mensaje: "Espera un momento mientras validamos el enlace.",
      icono: "escudo" as const,
    },
    correcto: {
      titulo: "Cuenta verificada",
      mensaje: "Tu correo institucional fue confirmado. Ya puedes iniciar sesión.",
      icono: "verificado" as const,
    },
    invalido: {
      titulo: "Enlace no válido",
      mensaje: "El enlace venció, ya fue utilizado o no corresponde a una solicitud vigente.",
      icono: "informacion" as const,
    },
    error: {
      titulo: "No pudimos verificar la cuenta",
      mensaje: "El servicio no está disponible en este momento. Intenta nuevamente.",
      icono: "informacion" as const,
    },
  }[estado];

  const claseAccion =
    "bg-primario hover:bg-primario-fuerte mt-7 flex h-12 items-center justify-center rounded-xl text-sm font-bold text-white disabled:pointer-events-none disabled:opacity-60";

  return (
    <div className="flex min-h-[430px] max-w-xl flex-col justify-center">
      <span className="bg-primario-suave text-primario flex size-14 items-center justify-center rounded-full">
        <Icono nombre={contenido.icono} className="size-7" />
      </span>
      <h1 className="text-texto mt-5 text-3xl font-extrabold tracking-tight">{contenido.titulo}</h1>
      <p className="text-texto-suave mt-3 text-sm leading-relaxed" role="status">
        {contenido.mensaje}
      </p>
      {(estado === "pendiente" || estado === "verificando" || estado === "error") && (
        <button
          type="button"
          onClick={confirmar}
          disabled={estado === "verificando"}
          className={claseAccion}
        >
          {estado === "error" ? "Intentar de nuevo" : "Confirmar mi correo"}
        </button>
      )}
      {estado === "correcto" && (
        <Link href="/iniciar-sesion" className={claseAccion}>
          Ir a iniciar sesión
        </Link>
      )}
      {estado === "invalido" && (
        <Link href="/reenviar-verificacion" className={claseAccion}>
          Solicitar un enlace nuevo
        </Link>
      )}
    </div>
  );
}
