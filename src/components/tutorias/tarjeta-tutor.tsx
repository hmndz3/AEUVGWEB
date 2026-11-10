import Link from "next/link";

import { Tarjeta, TarjetaTexto, TarjetaTitulo } from "@/components/ui/tarjeta";
import { inicialesDe } from "@/lib/auth/usuario-sesion-cliente";
import type { TutorVista } from "@/lib/tutorias/consultas-tutorias";
import {
  ETIQUETAS_DIA,
  ETIQUETAS_MODALIDAD,
  formatearRangoHoras,
} from "@/lib/tutorias/formato-tutorias";

/** Franjas que caben en la tarjeta antes de resumir el resto. */
const FRANJAS_VISIBLES = 3;

/**
 * Avatar del tutor.
 *
 * Usa su fotografía cuando la tiene y sus iniciales cuando no, que es lo que
 * la plataforma ha mostrado desde el Sprint 1. La foto no es obligatoria, así
 * que las iniciales no son un respaldo temporal: son el caso habitual.
 */
export function AvatarTutor({
  nombre,
  fotoUrl,
  tamano = "size-14",
}: {
  nombre: string;
  fotoUrl: string | null;
  tamano?: string;
}) {
  if (fotoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- la imagen la sirve
         la propia plataforma desde el volumen; no pasa por el optimizador
         porque su host depende del ambiente. */
      <img
        src={fotoUrl}
        alt={`Fotografía de ${nombre}`}
        className={`${tamano} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${tamano} bg-primario grid shrink-0 place-items-center rounded-full font-bold text-white`}
    >
      {inicialesDe(nombre)}
    </span>
  );
}

/**
 * Un tutor en el directorio.
 *
 * La tarjeta trae lo que hace falta para decidir a quién escribirle: quién es,
 * qué cursos da, cuándo puede y cuántas tutorías lleva. El detalle completo y
 * la solicitud viven en su ficha, para que el listado se pueda recorrer de un
 * vistazo.
 */
export function TarjetaTutor({ tutor }: { tutor: TutorVista }) {
  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <AvatarTutor nombre={tutor.nombreCompleto} fotoUrl={tutor.fotoUrl} />
        <div className="min-w-0">
          <TarjetaTitulo>{tutor.nombreCompleto}</TarjetaTitulo>
          <TarjetaTexto className="mt-0.5">{tutor.carrera}</TarjetaTexto>
          {tutor.tutoriasCompletadas > 0 && (
            <TarjetaTexto className="mt-0.5 text-xs">
              {tutor.tutoriasCompletadas}{" "}
              {tutor.tutoriasCompletadas === 1 ? "tutoría impartida" : "tutorías impartidas"}
            </TarjetaTexto>
          )}
        </div>
      </div>

      {tutor.descripcion && (
        <TarjetaTexto className="leading-relaxed">{tutor.descripcion}</TarjetaTexto>
      )}

      <div>
        <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">Cursos</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tutor.cursos.map((curso) => (
            <span
              key={curso.idCurso}
              title={curso.nombre}
              className="bg-primario-suave text-primario-fuerte rounded-full px-3 py-1 text-xs font-semibold"
            >
              {curso.codigo}
            </span>
          ))}
        </div>
      </div>

      {tutor.disponibilidades.length > 0 && (
        <div>
          <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">Disponible</p>
          <ul className="text-texto-suave mt-1.5 space-y-0.5 text-sm">
            {tutor.disponibilidades.slice(0, FRANJAS_VISIBLES).map((franja) => (
              <li key={franja.idDisponibilidad}>
                {ETIQUETAS_DIA[franja.diaSemana]} de{" "}
                {formatearRangoHoras(franja.horaInicio, franja.horaFin)} ·{" "}
                {ETIQUETAS_MODALIDAD[franja.modalidad]}
              </li>
            ))}
            {tutor.disponibilidades.length > FRANJAS_VISIBLES && (
              <li className="text-xs">
                y {tutor.disponibilidades.length - FRANJAS_VISIBLES} franja
                {tutor.disponibilidades.length - FRANJAS_VISIBLES === 1 ? "" : "s"} más
              </li>
            )}
          </ul>
        </div>
      )}

      <Link
        href={`/tutorias/${tutor.idTutor}`}
        className="text-primario mt-auto text-sm font-bold hover:underline"
      >
        Ver y solicitar tutoría →
      </Link>
    </Tarjeta>
  );
}
