import Link from "next/link";
import { notFound } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { AvatarTutor } from "@/components/tutorias/tarjeta-tutor";
import { FormularioSolicitud } from "@/components/tutorias/formulario-solicitud";
import { verificarAcceso } from "@/lib/auth/guardias";
import { obtenerTutor } from "@/lib/tutorias/consultas-tutorias";
import {
  ETIQUETAS_DIA,
  ETIQUETAS_MODALIDAD,
  formatearRangoHoras,
} from "@/lib/tutorias/formato-tutorias";

export const dynamic = "force-dynamic";

export default async function PaginaTutor({ params }: { params: Promise<{ id: string }> }) {
  const tutor = await obtenerTutor(Number((await params).id));
  if (!tutor) notFound();

  const acceso = await verificarAcceso();

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link href="/tutorias" className="text-primario text-sm font-bold hover:underline">
            ← Volver a las tutorías
          </Link>

          <div className="mt-4 flex flex-wrap items-start gap-4">
            <AvatarTutor
              nombre={tutor.nombreCompleto}
              fotoUrl={tutor.fotoUrl}
              tamano="size-20 text-xl"
            />
            <div className="min-w-0">
              <h1 className="text-texto text-3xl font-extrabold tracking-tight">
                {tutor.nombreCompleto}
              </h1>
              <p className="text-texto-suave mt-1">
                {tutor.carrera} · {tutor.facultad}
              </p>
              {tutor.tutoriasCompletadas > 0 && (
                <p className="text-texto-suave mt-0.5 text-sm">
                  {tutor.tutoriasCompletadas}{" "}
                  {tutor.tutoriasCompletadas === 1 ? "tutoría impartida" : "tutorías impartidas"}
                </p>
              )}
            </div>
          </div>

          {tutor.descripcion && (
            <p className="text-texto-suave mt-4 max-w-2xl leading-relaxed">{tutor.descripcion}</p>
          )}
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-texto text-lg font-bold">Cursos que imparte</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {tutor.cursos.map((curso) => (
                <li
                  key={curso.idCurso}
                  className="border-borde bg-superficie rounded-2xl border px-4 py-3"
                >
                  <span className="text-texto font-mono text-sm font-bold">{curso.codigo}</span>
                  <span className="text-texto-suave block text-sm">{curso.nombre}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-texto text-lg font-bold">Cuándo puede</h2>
            {tutor.disponibilidades.length === 0 ? (
              <p className="text-texto-suave mt-3 text-sm">Todavía no publicó sus horarios.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {tutor.disponibilidades.map((franja) => (
                  <li
                    key={franja.idDisponibilidad}
                    className="border-borde bg-superficie rounded-2xl border px-4 py-3"
                  >
                    <span className="text-texto text-sm font-semibold">
                      {ETIQUETAS_DIA[franja.diaSemana]} de{" "}
                      {formatearRangoHoras(franja.horaInicio, franja.horaFin)}
                    </span>
                    <span className="text-texto-suave block text-xs">
                      {ETIQUETAS_MODALIDAD[franja.modalidad]}
                      {franja.ubicacionEnlace ? ` · ${franja.ubicacionEnlace}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {tutor.informacionContacto && (
          <section className="border-borde bg-superficie-suave rounded-[1.25rem] border p-5">
            <h2 className="text-texto text-sm font-bold">Cómo contactarlo</h2>
            <p className="text-texto-suave mt-1 text-sm leading-relaxed whitespace-pre-line">
              {tutor.informacionContacto}
            </p>
          </section>
        )}

        <section className="border-borde bg-superficie rounded-[1.25rem] border p-6">
          <h2 className="text-texto text-lg font-bold">Solicitar una tutoría</h2>
          <p className="text-texto-suave mt-1 mb-5 text-sm leading-relaxed">
            Queda agendada de una vez: el tutor ya publicó en qué horarios puede. Si surge algo,
            cualquiera de los dos puede cancelarla desde su perfil.
          </p>

          <FormularioSolicitud tutor={tutor} conSesion={acceso.tipo === "autorizado"} />
        </section>
      </div>
    </MarcoSitio>
  );
}
