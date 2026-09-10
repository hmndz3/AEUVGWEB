"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECCIONES_ADMIN } from "@/components/admin/secciones";
import { cn } from "@/lib/utils";

export function BarraLateralAdmin() {
  const rutaActual = usePathname();

  return (
    <aside className="bg-texto flex w-full shrink-0 flex-col text-white md:sticky md:top-0 md:h-dvh md:w-64">
      <Link href="/" className="flex items-center gap-3 px-5 py-6">
        <Image src="/logo-aeuvg.png" alt="AEUVG" width={36} height={36} className="rounded-full" />
        <span className="flex flex-col leading-tight">
          <span className="font-extrabold">AEUVG</span>
          <span className="text-[11px] text-white/60">Panel administrativo</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-6">
        {SECCIONES_ADMIN.map((seccion) => {
          const activo =
            seccion.href === "/admin"
              ? rutaActual === "/admin"
              : rutaActual.startsWith(seccion.href);

          return (
            <Link
              key={seccion.href}
              href={seccion.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activo ? "bg-primario font-semibold text-white" : "text-white/70 hover:bg-white/10"
              )}
            >
              {seccion.texto}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
