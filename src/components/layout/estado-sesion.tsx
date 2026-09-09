"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { esAdministrador } from "@/lib/auth/roles";
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
  const [cerrando, setCerrando] = useState(false);

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

  async function manejarCierre() {
    setCerrando(true);
    await cerrarSesion();
    setEstado({ fase: "anonimo" });
    setCerrando(false);
    router.push("/");
    router.refresh();
  }

  if (estado.fase === "cargando") {
    return <div className="bg-superficie-suave h-9 w-32 animate-pulse rounded-full" />;
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
    <div className="flex shrink-0 items-center gap-3">
      {esAdministrador(usuario.roles) && (
        <Link
          href="/admin"
          className="text-primario hover:bg-primario-suave hidden rounded-full px-3 py-2 text-sm font-semibold transition-colors md:inline-flex"
        >
          Panel
        </Link>
      )}

      <Link href="/perfil" className="flex items-center gap-2" title={usuario.correo}>
        <span className="bg-primario grid size-9 place-items-center rounded-full text-xs font-bold text-white">
          {inicialesDe(usuario.nombreCompleto)}
        </span>
        <span className="text-texto hidden max-w-32 truncate text-sm font-semibold sm:inline">
          {usuario.nombreCompleto}
        </span>
      </Link>

      <button
        type="button"
        onClick={manejarCierre}
        disabled={cerrando}
        className="border-borde text-texto-suave hover:text-texto hover:bg-superficie-suave inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {cerrando ? "Cerrando…" : "Cerrar sesión"}
      </button>
    </div>
  );
}
