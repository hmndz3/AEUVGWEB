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

export function NavegacionPrincipal() {
  const rutaActual = usePathname();
  const [roles, setRoles] = useState<Rol[] | null>(null);

  useEffect(() => {
    const controlador = new AbortController();

    consultarSesion(controlador.signal)
      .then((usuario) => setRoles(usuario?.roles ?? []))
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
    <nav className="hidden items-center gap-1 lg:flex">
      {visibles.map((enlace) => {
        const activo =
          enlace.href === "/" ? rutaActual === "/" : rutaActual.startsWith(enlace.href);

        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "bg-primario-suave text-primario font-semibold"
                : "text-texto-suave hover:text-texto hover:bg-superficie-suave"
            )}
          >
            {enlace.texto}
          </Link>
        );
      })}
    </nav>
  );
}
