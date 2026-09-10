"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icono } from "@/components/autenticacion/icono";

type Estado = "verificando" | "correcto" | "invalido" | "error";

export function ResultadoVerificacion({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>(token ? "verificando" : "invalido");
  const solicitudIniciada = useRef(false);

  useEffect(() => {
    if (!token || solicitudIniciada.current) return;
    solicitudIniciada.current = true;
    window.history.replaceState(null, "", "/verificar-correo");

    void fetch("/api/auth/verificar-correo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((respuesta) => setEstado(respuesta.ok ? "correcto" : "invalido"))
      .catch(() => setEstado("error"));
  }, [token]);

  const contenido = {
    verificando: {
      titulo: "Verificando tu cuenta…",
      mensaje: "Espera un momento mientras validamos el enlace.",
      icono: "escudo" as const,
    },
    correcto: {
      titulo: "Cuenta verificada",
      mensaje:
        "Tu correo institucional fue confirmado. Ya podrás iniciar sesión cuando se integre el acceso.",
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

  return (
    <div className="flex min-h-[430px] max-w-xl flex-col justify-center">
      <span className="bg-primario-suave text-primario flex size-14 items-center justify-center rounded-full">
        <Icono nombre={contenido.icono} className="size-7" />
      </span>
      <h1 className="text-texto mt-5 text-3xl font-extrabold tracking-tight">{contenido.titulo}</h1>
      <p className="text-texto-suave mt-3 text-sm leading-relaxed" role="status">
        {contenido.mensaje}
      </p>
      {estado === "correcto" && (
        <Link
          href="/iniciar-sesion"
          className="bg-primario hover:bg-primario-fuerte mt-7 flex h-12 items-center justify-center rounded-xl text-sm font-bold text-white"
        >
          Ir a iniciar sesión
        </Link>
      )}
      {estado === "invalido" && (
        <Link
          href="/reenviar-verificacion"
          className="bg-primario hover:bg-primario-fuerte mt-7 flex h-12 items-center justify-center rounded-xl text-sm font-bold text-white"
        >
          Solicitar un enlace nuevo
        </Link>
      )}
    </div>
  );
}
