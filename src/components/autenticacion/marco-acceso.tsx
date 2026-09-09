import Image from "next/image";
import Link from "next/link";

import { Icono } from "@/components/autenticacion/icono";
import { cn } from "@/lib/utils";

type PropsMarcoAcceso = {
  children: React.ReactNode;
  panel: React.ReactNode;
  variante?: "violeta" | "seguridad";
};

export function EncabezadoAcceso() {
  return (
    <header className="border-borde/70 bg-superficie/85 sticky top-0 z-20 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="hidden items-center gap-3 sm:flex">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={34} height={34} />
          <span className="flex flex-col leading-tight">
            <strong className="text-texto text-sm">AEUVG</strong>
            <span className="text-texto-suave text-[10px] font-bold tracking-wide uppercase">
              Asociación de Estudiantes UVG
            </span>
          </span>
        </Link>
        <Link href="/" className="flex items-center gap-2 sm:hidden">
          <Icono nombre="flechaAtras" className="size-4" />
          <span className="text-sm font-semibold">Volver</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navegación de acceso">
          <Link
            href="/iniciar-sesion"
            className="text-texto-suave hover:text-texto text-xs font-semibold"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/crear-cuenta"
            className="text-texto-suave hover:text-texto text-xs font-semibold"
          >
            Registrarse
          </Link>
          <Link
            href="/recuperar-contrasena"
            className="text-texto-suave hover:text-texto text-xs font-semibold"
          >
            Ayuda de cuenta
          </Link>
          <span className="text-texto-suave text-xs font-semibold">Centro de ayuda</span>
          <Link href="/" className="text-texto-suave hover:text-texto text-xs font-semibold">
            Volver al portal
          </Link>
          <span className="bg-texto flex size-7 items-center justify-center rounded-full text-white">
            <Icono nombre="persona" className="size-4" />
          </span>
        </nav>
        <Image className="sm:hidden" src="/logo-aeuvg.png" alt="AEUVG" width={28} height={28} />
      </div>
    </header>
  );
}

export function MarcoAcceso({ children, panel, variante = "violeta" }: PropsMarcoAcceso) {
  return (
    <div className="bg-fondo flex min-h-dvh flex-col">
      <EncabezadoAcceso />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-6 sm:px-6 lg:py-12">
        <section className="bg-superficie grid w-full overflow-hidden rounded-[1.25rem] shadow-[0_20px_40px_-15px_rgba(28,22,43,0.18)] lg:grid-cols-12">
          <div className="p-6 sm:p-10 lg:col-span-7 lg:p-12">{children}</div>
          <aside
            className={cn(
              "relative hidden overflow-hidden p-10 text-white lg:col-span-5 lg:flex lg:flex-col",
              variante === "violeta" ? "bg-primario" : "bg-superficie-suave text-texto"
            )}
          >
            {variante === "violeta" && (
              <>
                <div className="bg-cielo/30 absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
                <div className="bg-magenta/25 absolute -bottom-20 -left-20 size-80 rounded-full blur-3xl" />
              </>
            )}
            <div className="relative flex h-full flex-col">{panel}</div>
          </aside>
        </section>
      </main>
      <footer className="border-borde/50 text-texto-suave px-4 py-5 text-center text-[11px] sm:px-6">
        © 2026 Asociación de Estudiantes Universidad del Valle de Guatemala · Todos los derechos
        reservados
      </footer>
    </div>
  );
}
