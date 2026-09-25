"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  cerrarSesion,
  consultarSesion,
  inicialesDe,
  type UsuarioSesionCliente,
} from "@/lib/auth/usuario-sesion-cliente";

type Estado =
  | { fase: "cargando" }
  | { fase: "anonimo" }
  | { fase: "autenticado"; usuario: UsuarioSesionCliente };

export function EstadoSesion() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controlador = new AbortController();

    consultarSesion(controlador.signal)
      .then((usuario) =>
        setEstado(usuario ? { fase: "autenticado", usuario } : { fase: "anonimo" })
      )
      .catch(() => {
        if (!controlador.signal.aborted) setEstado({ fase: "anonimo" });
      });

    return () => controlador.abort();
  }, []);

  // El menú se cierra al hacer clic fuera o con Escape, como cualquier otro.
  useEffect(() => {
    if (!abierto) return;

    const alHacerClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionar);

    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionar);
    };
  }, [abierto]);

  async function manejarCierre() {
    setCerrando(true);
    await cerrarSesion();
    setAbierto(false);
    setEstado({ fase: "anonimo" });
    setCerrando(false);
    router.push("/");
    router.refresh();
  }

  if (estado.fase === "cargando") {
    return <div className="bg-superficie-suave h-9 w-28 animate-pulse rounded-full" />;
  }

  if (estado.fase === "anonimo") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/iniciar-sesion"
          className="text-texto-suave hover:text-texto hidden px-3 py-2 text-sm font-medium sm:inline-flex"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/crear-cuenta"
          className="bg-primario hover:bg-primario-fuerte inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white transition-colors"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  const { usuario } = estado;

  return (
    <div ref={contenedor} className="relative shrink-0">
      {/*
        La cuenta es un solo control: el cierre de sesión vive dentro del menú y
        no ocupa espacio permanente en el encabezado, donde competía con la
        navegación y empujaba el nombre contra el borde.
      */}
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="hover:bg-superficie-suave flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors"
      >
        <span className="bg-primario grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white">
          {inicialesDe(usuario.nombreCompleto)}
        </span>
        <span className="text-texto hidden max-w-32 truncate text-sm font-semibold sm:inline">
          {usuario.nombreCompleto}
        </span>
        <span aria-hidden className="text-texto-suave text-[10px]">
          ▾
        </span>
      </button>

      <div
        role="menu"
        hidden={!abierto}
        className="border-borde bg-superficie absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border shadow-lg"
      >
        <div className="border-borde border-b px-4 py-3">
          <p className="text-texto truncate text-sm font-bold">{usuario.nombreCompleto}</p>
          <p className="text-texto-suave truncate text-xs">{usuario.correo}</p>
        </div>

        <button
          type="button"
          role="menuitem"
          onClick={manejarCierre}
          disabled={cerrando}
          className="text-texto-suave hover:bg-superficie-suave hover:text-texto w-full px-4 py-3 text-left text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
