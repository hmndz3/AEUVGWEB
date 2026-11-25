"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import {
  cerrarSesion,
  consultarSesion,
  type UsuarioSesionCliente,
} from "@/lib/auth/usuario-sesion-cliente";
import { EVENTO_NOTIFICACIONES } from "@/lib/notificaciones/tipos-notificacion";

type Estado =
  | { fase: "cargando" }
  | { fase: "anonimo" }
  | { fase: "autenticado"; usuario: UsuarioSesionCliente };

export function EstadoSesion() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [sinLeer, setSinLeer] = useState(0);
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

  // El contador se consulta aparte de la sesión: es el único dato del
  // encabezado que cambia sin recargar, y pedirlo junto con el usuario
  // obligaría a volver a resolver la sesión cada vez que se lee un aviso.
  useEffect(() => {
    if (estado.fase !== "autenticado") return;

    const controlador = new AbortController();

    const consultar = () =>
      fetch("/api/notificaciones", { signal: controlador.signal })
        .then((respuesta) => (respuesta.ok ? respuesta.json() : { sinLeer: 0 }))
        .then((cuerpo: { sinLeer?: number }) => setSinLeer(cuerpo.sinLeer ?? 0))
        .catch(() => {
          // El contador es un adorno: sin él el menú funciona igual.
        });

    consultar();
    // La pantalla de notificaciones avisa cuando se lee alguna, para que el
    // contador no siga mostrando un aviso que ya se abrió.
    window.addEventListener(EVENTO_NOTIFICACIONES, consultar);

    return () => {
      controlador.abort();
      window.removeEventListener(EVENTO_NOTIFICACIONES, consultar);
    };
  }, [estado.fase]);

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
        <Avatar nombre={usuario.nombreCompleto} fotoUrl={usuario.fotoUrl} tamano="size-9 text-xs" />
        <span className="text-texto hidden max-w-32 truncate text-sm font-semibold sm:inline">
          {usuario.nombreCompleto}
        </span>
        {sinLeer > 0 && (
          <span
            aria-label={`${sinLeer} notificaciones sin leer`}
            className="bg-primario rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
          >
            {sinLeer}
          </span>
        )}
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

        <Link
          href="/perfil"
          role="menuitem"
          onClick={() => setAbierto(false)}
          className="text-texto-suave hover:bg-superficie-suave hover:text-texto border-borde block border-b px-4 py-3 text-sm font-semibold transition-colors"
        >
          Mi perfil
        </Link>

        <Link
          href="/notificaciones"
          role="menuitem"
          onClick={() => setAbierto(false)}
          className="text-texto-suave hover:bg-superficie-suave hover:text-texto border-borde flex items-center justify-between gap-2 border-b px-4 py-3 text-sm font-semibold transition-colors"
        >
          Notificaciones
          {sinLeer > 0 && (
            <span className="bg-primario rounded-full px-2 py-0.5 text-xs font-bold text-white">
              {sinLeer}
            </span>
          )}
        </Link>

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
