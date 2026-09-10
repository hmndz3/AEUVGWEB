import Link from "next/link";

export function SeccionPrincipal() {
  return (
    <section className="from-primario to-magenta relative overflow-hidden bg-gradient-to-br text-white">
      {/* Formas de fondo inspiradas en las figuras del logo */}
      <div
        aria-hidden
        className="absolute -top-24 -right-20 size-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="bg-ambar/30 absolute -bottom-28 -left-16 size-96 rounded-full blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide uppercase backdrop-blur">
          Comunidad estudiantil UVG
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Tu comunidad, tus eventos, tu voz en UVG
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
          La plataforma de la Asociación General de Estudiantes para descubrir eventos, conocer
          asociaciones y clubes, encontrar tutorías y llevar el control de tus horas beca.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/eventos"
            className="text-primario inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02]"
          >
            Ver próximos eventos
          </Link>
          <Link
            href="/sobre-aeuvg"
            className="inline-flex h-12 items-center rounded-full border border-white/40 px-7 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Conocer AEUVG
          </Link>
        </div>
      </div>
    </section>
  );
}
