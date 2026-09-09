"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ROLES, tieneRol, type Rol } from "@/lib/auth/roles";
import { consultarSesion } from "@/lib/auth/usuario-sesion-cliente";
import { cn } from "@/lib/utils";

type Enlace = {
  href: string;
  texto: string;
  /** Sin roles, el enlace es público. */
  roles?: readonly Rol[];
};

const ENLACES: Enlace[] = [
  { href: "/", texto: "Inicio" },
  { href: "/eventos", texto: "Eventos" },
  { href: "/asociaciones", texto: "Asociaciones" },
  { href: "/clubes", texto: "Clubes" },
  { href: "/tutorias", texto: "Tutorías" },
  { href: "/sobre-aeuvg", texto: "Sobre AEUVG" },
  {
    href: "/perfil",
    texto: "Mi perfil",
    roles: [ROLES.estudiante, ROLES.tutor, ROLES.administrador],
  },
  { href: "/admin", texto: "Panel", roles: [ROLES.administrador] },
];

function esActivo(href: string, rutaActual: string): boolean {
  return href === "/" ? rutaActual === "/" : rutaActual.startsWith(href);
}

export function NavegacionPrincipal() {
  const rutaActual = usePathname();
  const [roles, setRoles] = useState<Rol[] | null>(null);
  const [conSesion, setConSesion] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();

    consultarSesion(controlador.signal)
      .then((usuario) => {
        setRoles(usuario?.roles ?? []);
        setConSesion(Boolean(usuario));
      })
      .catch(() => {
        if (!controlador.signal.aborted) setRoles([]);
      });

    return () => controlador.abort();
  }, []);

  // Mientras se resuelve la sesión solo se muestran los enlaces públicos, para
  // que el menú no parpadee mostrando opciones que luego desaparecen.
  const visibles = ENLACES.filter(
    (enlace) => !enlace.roles || (roles !== null && tieneRol(roles, enlace.roles))
  );

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex">
        {visibles.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={esActivo(enlace.href, rutaActual) ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition-colors",
              esActivo(enlace.href, rutaActual)
                ? "bg-primario-suave text-primario font-semibold"
                : "text-texto-suave hover:text-texto hover:bg-superficie-suave"
            )}
          >
            {enlace.texto}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setMenuAbierto((abierto) => !abierto)}
        aria-expanded={menuAbierto}
        aria-controls="menu-movil"
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        className="border-borde text-texto hover:bg-superficie-suave grid size-10 shrink-0 place-items-center rounded-full border transition-colors lg:hidden"
      >
        <span aria-hidden className="flex flex-col gap-1">
          <span className="bg-texto block h-0.5 w-4 rounded-full" />
          <span className="bg-texto block h-0.5 w-4 rounded-full" />
          <span className="bg-texto block h-0.5 w-4 rounded-full" />
        </span>
      </button>

      <div
        id="menu-movil"
        hidden={!menuAbierto}
        className="border-borde bg-superficie absolute inset-x-0 top-full border-b shadow-lg lg:hidden"
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
          {visibles.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => setMenuAbierto(false)}
              aria-current={esActivo(enlace.href, rutaActual) ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                esActivo(enlace.href, rutaActual)
                  ? "bg-primario-suave text-primario font-semibold"
                  : "text-texto-suave hover:bg-superficie-suave"
              )}
            >
              {enlace.texto}
            </Link>
          ))}

          {/* En pantallas pequeñas el encabezado no tiene espacio para el
              acceso, así que se ofrece aquí. */}
          {!conSesion && (
            <Link
              href="/iniciar-sesion"
              onClick={() => setMenuAbierto(false)}
              className="text-texto-suave hover:bg-superficie-suave border-borde mt-2 rounded-xl border px-4 py-3 text-sm font-semibold sm:hidden"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
