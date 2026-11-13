import Link from "next/link";

import { ListaTutorias } from "@/components/tutorias/lista-tutorias";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { PostulacionAdmin, TutoriaVista, TutorVista } from "@/lib/tutorias/consultas-tutorias";
import { ETIQUETAS_ESTADO_POSTULACION } from "@/lib/tutorias/formato-tutorias";

const TONOS = {
  PENDIENTE: "pendiente",
  APROBADA: "acreditada",
  RECHAZADA: "error",
} as const;

/**
 * Tutorías dentro del perfil del estudiante.
 *
 * Reúne las dos caras de la misma sección: las tutorías que la persona
 * solicitó y, si además es tutor, el acceso a su panel. Separarlas en dos
 * secciones obligaría a quien es las dos cosas a buscar en dos sitios lo que
 * es un mismo tema.
 */
export function TutoriasPerfil({
  tutorias,
  postulacion,
  tutor,
}: {
  tutorias: TutoriaVista[];
  postulacion: PostulacionAdmin | null;
  tutor: TutorVista | null;
}) {
  return (
    <section id="mis-tutorias" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-texto text-lg font-bold">Mis tutorías</h2>
          <p className="text-texto-suave mt-1 text-sm leading-relaxed">
            Las que has agendado con otros estudiantes. Puedes cancelar una si te surge algo.
          </p>
        </div>

        <Link href="/tutorias" className="text-primario text-sm font-bold hover:underline">
          Buscar un tutor →
        </Link>
      </div>

      <ListaTutorias tutorias={tutorias} />

      {/* Ser tutor es la otra mitad de esta sección: o se tiene el panel, o se
          está esperando respuesta, o se puede postular. */}
      {tutor ? (
        <div className="border-borde bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          <div>
            <p className="text-texto text-sm font-bold">También eres tutor</p>
            <p className="text-texto-suave mt-0.5 text-sm">
              Impartes {tutor.cursos.length} {tutor.cursos.length === 1 ? "curso" : "cursos"} y
              llevas {tutor.tutoriasCompletadas}{" "}
              {tutor.tutoriasCompletadas === 1 ? "tutoría impartida" : "tutorías impartidas"}.
            </p>
          </div>
          <Link href="/tutorias/panel" className="text-primario text-sm font-bold hover:underline">
            Ir a mi panel de tutor →
          </Link>
        </div>
      ) : postulacion ? (
        <div className="border-borde bg-superficie-suave flex flex-col gap-2 rounded-[1.25rem] border p-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-texto text-sm font-bold">Tu postulación para ser tutor</p>
            <EtiquetaEstado tono={TONOS[postulacion.estado]}>
              {ETIQUETAS_ESTADO_POSTULACION[postulacion.estado]}
            </EtiquetaEstado>
          </div>
          <p className="text-texto-suave text-sm leading-relaxed">
            {postulacion.estado === "PENDIENTE"
              ? "AEUVG la está revisando y te avisará cuando la resuelva."
              : (postulacion.comentarioRevision ??
                "AEUVG ya la resolvió. Escríbele si quieres saber más.")}
          </p>
          {postulacion.estado === "RECHAZADA" && (
            <Link
              href="/tutorias/postular"
              className="text-primario text-sm font-bold hover:underline"
            >
              Postularme de nuevo
            </Link>
          )}
        </div>
      ) : (
        <div className="border-borde bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          <div>
            <p className="text-texto text-sm font-bold">¿Llevaste bien algún curso?</p>
            <p className="text-texto-suave mt-0.5 text-sm">
              Puedes postularte para dar tutorías de los cursos que aprobaste con buena nota.
            </p>
          </div>
          <Link
            href="/tutorias/postular"
            className="text-primario text-sm font-bold hover:underline"
          >
            Quiero ser tutor →
          </Link>
        </div>
      )}
    </section>
  );
}
