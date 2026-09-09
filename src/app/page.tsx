import { MarcoSitio } from "@/components/layout/marco-sitio";

export default function PaginaInicio() {
  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h1 className="text-texto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Tu comunidad, tus eventos, tu voz en UVG
        </h1>
        <p className="text-texto-suave mt-5 max-w-2xl text-lg leading-relaxed">
          La plataforma de la Asociación General de Estudiantes de la Universidad del Valle de
          Guatemala para descubrir eventos, conocer asociaciones y clubes, encontrar tutorías y
          llevar el control de tus horas beca.
        </p>
      </section>
    </MarcoSitio>
  );
}
