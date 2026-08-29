export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center">
      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400">
        Sprint 1 · Fundamentos del sistema
      </span>
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">AEUVG</h1>
      <p className="max-w-xl text-lg text-slate-300">
        Plataforma web de la Asociación General de Estudiantes de la Universidad del Valle de
        Guatemala. Estamos construyendo el espacio central para eventos, asociaciones, clubes,
        tutorías y horas beca.
      </p>
      <p className="text-sm text-slate-500">Sitio en construcción · agosto 2026</p>
    </main>
  );
}
