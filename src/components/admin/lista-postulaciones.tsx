import { RevisionPostulacion } from "@/components/admin/revision-postulacion";
import { Avatar } from "@/components/ui/avatar";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { PostulacionAdmin } from "@/lib/tutorias/consultas-tutorias";
import { formatearFechaAcreditacion } from "@/lib/horas-beca/formato-horas";
import { ETIQUETAS_ESTADO_POSTULACION } from "@/lib/tutorias/formato-tutorias";
import { NOTA_MINIMA_TUTOR } from "@/validators/tutoria";

const TONOS = {
  PENDIENTE: "pendiente",
  APROBADA: "acreditada",
  RECHAZADA: "error",
} as const;

/**
 * Postulaciones para ser tutor, en tarjetas y no en tabla.
 *
 * Cada una trae los cursos con su nota y su comprobante, que es lo que hay que
 * mirar para decidir: en una tabla eso no cabe sin esconderlo detrás de un
 * detalle, y entonces la revisión se haría a ciegas.
 */
export function ListaPostulaciones({ postulaciones }: { postulaciones: PostulacionAdmin[] }) {
  return (
    <div className="flex flex-col gap-4">
      {postulaciones.map((postulacion) => (
        <article
          key={postulacion.idPostulacion}
          className="border-borde bg-superficie rounded-[1.25rem] border p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                nombre={postulacion.nombreCompleto}
                fotoUrl={postulacion.fotoUrl}
                tamano="size-14 text-lg"
              />
              <div className="min-w-0">
                <h3 className="text-texto text-lg font-bold">{postulacion.nombreCompleto}</h3>
                <p className="text-texto-suave mt-0.5 text-sm">
                  <span className="font-mono font-semibold">{postulacion.carnet}</span> ·{" "}
                  {postulacion.carrera} · {postulacion.facultad}
                </p>
                <p className="text-texto-suave mt-0.5 text-xs">{postulacion.correoUvg}</p>
              </div>
            </div>

            <div className="text-right">
              <EtiquetaEstado tono={TONOS[postulacion.estado]}>
                {ETIQUETAS_ESTADO_POSTULACION[postulacion.estado]}
              </EtiquetaEstado>
              <p className="text-texto-suave mt-1 text-xs">
                {formatearFechaAcreditacion(postulacion.fechaPostulacion)}
              </p>
            </div>
          </div>

          {postulacion.comentarioSolicitante && (
            <p className="text-texto-suave mt-3 text-sm leading-relaxed italic">
              “{postulacion.comentarioSolicitante}”
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {postulacion.cursos.map((curso) => {
              const suficiente =
                curso.notaObtenida !== null && curso.notaObtenida >= NOTA_MINIMA_TUTOR;

              return (
                <div
                  key={curso.idCurso}
                  className="bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-texto text-sm font-semibold">
                      <span className="font-mono">{curso.codigo}</span> · {curso.nombre}
                    </p>
                    {curso.propuesto && (
                      <p className="text-texto-suave mt-0.5 text-xs">
                        Propuesto con la opción Otro: entra al catálogo si apruebas la postulación.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${suficiente ? "text-[#00695a]" : "text-error"}`}
                    >
                      {curso.notaObtenida ?? "—"}
                    </span>
                    {/* El comprobante se abre aparte: es una imagen del
                        historial académico y en miniatura no se lee. */}
                    <a
                      href={curso.comprobanteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primario text-sm font-bold hover:underline"
                    >
                      Ver comprobante
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {postulacion.estado === "PENDIENTE" ? (
            <RevisionPostulacion
              idPostulacion={postulacion.idPostulacion}
              nombre={postulacion.nombreCompleto}
            />
          ) : (
            <div className="border-borde mt-4 border-t pt-3">
              <p className="text-texto-suave text-xs">
                Resuelta por {postulacion.revisadaPor ?? "AEUVG"}
                {postulacion.fechaRevision
                  ? ` el ${formatearFechaAcreditacion(postulacion.fechaRevision)}`
                  : ""}
                .
              </p>
              {postulacion.comentarioRevision && (
                <p className="text-texto-suave mt-1 text-sm leading-relaxed">
                  {postulacion.comentarioRevision}
                </p>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
