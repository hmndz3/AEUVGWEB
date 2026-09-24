import Image from "next/image";
import Link from "next/link";

import { EstadoSesion } from "@/components/layout/estado-sesion";

import { NavegacionPrincipal } from "@/components/layout/navegacion-principal";

export function Encabezado() {
  return (
    <header className="border-borde bg-superficie/90 sticky top-0 z-50 border-b backdrop-blur">
      {/* Franja con los colores del logo */}
      <div className="from-coral via-ambar to-magenta h-1.5 w-full bg-gradient-to-r" />
      <div className="relative mx-auto flex h-24 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="AEUVG, ir a la página principal"
          className="focus-visible:ring-primario flex shrink-0 items-center gap-3 rounded-full transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Image
            src="/logo-aeuvg.png"
            alt=""
            width={56}
            height={56}
            priority
            className="size-11 rounded-full sm:size-14"
          />
          <span className="text-texto text-xl leading-none font-extrabold tracking-tight sm:text-2xl">
            AEUVG
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-4 lg:justify-between">
          <NavegacionPrincipal />
          <EstadoSesion />
        </div>
      </div>
    </header>
  );
}
