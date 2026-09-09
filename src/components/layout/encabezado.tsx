import Image from "next/image";
import Link from "next/link";

import { EstadoSesion } from "@/components/layout/estado-sesion";

import { NavegacionPrincipal } from "@/components/layout/navegacion-principal";

export function Encabezado() {
  return (
    <header className="border-borde bg-superficie/90 sticky top-0 z-50 border-b backdrop-blur">
      {/* Franja con los colores del logo */}
      <div className="from-coral via-ambar to-magenta h-1.5 w-full bg-gradient-to-r" />
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/logo-aeuvg.png"
            alt="AEUVG"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-texto text-lg leading-none font-extrabold">AEUVG</span>
        </Link>

        <NavegacionPrincipal />

        <EstadoSesion />
      </div>
    </header>
  );
}
