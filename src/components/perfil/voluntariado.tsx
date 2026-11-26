import Link from "next/link";

import type { EstadoPostulacionEstudiante } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/**
 * Voluntariado del salón dentro del perfil del estudiante.
 *
 * Como las tutorías: o se tiene el panel de voluntario, o se está esperando
 * respuesta a la postulación, o se puede postular. Las horas que se ganan
 * atendiendo el salón aparecen junto con el resto en "Mis horas beca".
 */
export function VoluntariadoPerfil({
  esVoluntario,
  postulacion,
}: {
  esVoluntario: boolean;
  postulacion: EstadoPostulacionEstudiante;
}) {
  return (
    <section id="voluntariado" className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-lg font-bold">Préstamo de batas</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Puedes ser voluntario del salón de préstamo y ganar horas beca por atenderlo.
        </p>
      </div>

      {esVoluntario ? (
        <div className="border-borde bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          <div>
            <p className="text-texto text-sm font-bold">Eres voluntario del salón</p>
            <p className="text-texto-suave mt-0.5 text-sm">
              Registra préstamos, la lista negra y tus comprobantes de horas desde tu panel.
            </p>
          </div>
          <Link
            href="/prestamo-batas/panel"
            className="text-primario text-sm font-bold hover:underline"
          >
            Mi panel de voluntario →
          </Link>
        </div>
      ) : postulacion.estado === "pendiente" ? (
        <div className="border-borde bg-superficie-suave flex flex-col gap-1 rounded-[1.25rem] border p-5">
          <p className="text-texto text-sm font-bold">Tu postulación para ser voluntario</p>
          <p className="text-texto-suave text-sm leading-relaxed">
            AEUVG la está revisando y te avisará cuando te asigne a tus turnos.
          </p>
        </div>
      ) : (
        <div className="border-borde bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          <div>
            <p className="text-texto text-sm font-bold">¿Quieres ser voluntario?</p>
            <p className="text-texto-suave mt-0.5 text-sm">
              Atiende el salón en los horarios que te queden y gana horas beca por hacerlo.
            </p>
          </div>
          <Link
            href="/prestamo-batas/postular"
            className="text-primario text-sm font-bold hover:underline"
          >
            Postularme como voluntario →
          </Link>
        </div>
      )}
    </section>
  );
}
