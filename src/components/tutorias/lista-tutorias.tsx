"use client";

import { AccionesTutoria } from "@/components/tutorias/acciones-tutoria";
import { Avatar } from "@/components/ui/avatar";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { TutoriaVista } from "@/lib/tutorias/consultas-tutorias";
import { ETIQUETAS_ESTADO_TUTORIA, ETIQUETAS_MODALIDAD } from "@/lib/tutorias/formato-tutorias";
import { formatearHora12 } from "@/lib/ui/calendario-selector";

const TONOS = {
  PROGRAMADA: "pendiente",
  ACEPTADA: "informativo",
  RECHAZADA: "error",
  COMPLETADA: "acreditada",
  CANCELADA: "error",
} as const;

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const enGuatemala = (fecha: Date, opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-GT", { ...opciones, timeZone: "America/Guatemala" }).format(fecha);

/** La hora de reloj del país, para poder presentarla en doce horas. */
function horaDelPais(fecha: Date): string {
  return enGuatemala(fecha, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Cuánto dura la tutoría, redactado: "1 h 30 min". */
function duracionDe(inicio: Date, fin: Date): string {
  const minutos = Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;

  return `${horas} h ${resto} min`;
}

/** Un enlace es pulsable; una ubicación escrita a mano, no. */
function esEnlace(valor: string): boolean {
  return /^https?:\/\//i.test(valor.trim());
}

/** Icono de un trazo, a juego con los de los selectores. */
function Icono({ trazo }: { trazo: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="text-texto-suave mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={trazo} />
    </svg>
  );
}

const TRAZO_RELOJ = "M10 5.75V10l2.75 1.75M17.25 10a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0";
const TRAZO_LUGAR =
  "M10 17.5s5.5-4.6 5.5-8.5a5.5 5.5 0 1 0-11 0c0 3.9 5.5 8.5 5.5 8.5ZM10 9.75v.01";
const TRAZO_NOTA = "M5.75 3.75h8.5v12.5H5.75zM8 7h4M8 10h4M8 13h2.5";

function Dato({ trazo, children }: { trazo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icono trazo={trazo} />
      <span className="text-texto-suave min-w-0 text-sm leading-relaxed">{children}</span>
    </div>
  );
}

/**
 * Tutorías de la persona que mira, sea como estudiante o como tutor.
 *
 * Es la misma ficha en los dos lados porque la información es la misma: con
 * quién, qué curso, cuándo, cuánto dura y dónde presentarse. Lo que cambia es
 * a quién se nombra —al tutor o al estudiante— y que completar solo lo ofrece
 * el tutor, porque es quien sabe si la sesión ocurrió.
 *
 * La fecha va en un bloque aparte, a la izquierda, porque es el dato que se
 * busca al recorrer la lista: con todo en un párrafo había que leer cada
 * ficha entera para saber cuál es la próxima.
 */
export function ListaTutorias({
  tutorias,
  comoTutor = false,
}: {
  tutorias: TutoriaVista[];
  comoTutor?: boolean;
}) {
  if (tutorias.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
        {comoTutor
          ? "Todavía no te han solicitado ninguna tutoría. Publica tus horarios para que te encuentren."
          : "Todavía no has agendado ninguna tutoría."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tutorias.map((tutoria) => {
        const otro = comoTutor
          ? {
              nombre: tutoria.estudiante,
              fotoUrl: tutoria.estudianteFotoUrl,
              carnet: tutoria.estudianteCarnet,
              contacto: tutoria.estudianteCorreo,
              papel: "Estudiante",
            }
          : {
              nombre: tutoria.tutor,
              fotoUrl: tutoria.tutorFotoUrl,
              carnet: tutoria.tutorCarnet,
              contacto: tutoria.tutorContacto,
              papel: "Tutor",
            };

        // La ficha se atenúa cuando la cita ya no está en pie; mientras siga
        // viva —agendada o aceptada— se lee con todo el contraste.
        const pasada = tutoria.estado !== "PROGRAMADA" && tutoria.estado !== "ACEPTADA";

        return (
          <article
            key={tutoria.idTutoria}
            className={`border-borde bg-superficie overflow-hidden rounded-[1.25rem] border ${
              pasada ? "opacity-80" : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Bloque de fecha: día grande y mes, como un recorte de calendario. */}
              <div
                className={`flex shrink-0 flex-row items-center gap-3 px-5 py-4 sm:w-28 sm:flex-col sm:justify-center sm:gap-0 sm:py-6 ${
                  tutoria.estado === "CANCELADA" || tutoria.estado === "RECHAZADA"
                    ? "bg-superficie-suave"
                    : "bg-primario-suave"
                }`}
              >
                <span className="text-sobre-lavanda text-xs font-bold tracking-wide uppercase">
                  {enGuatemala(tutoria.fechaInicio, { weekday: "short" })}
                </span>
                <span className="text-sobre-lavanda text-3xl leading-none font-extrabold">
                  {enGuatemala(tutoria.fechaInicio, { day: "numeric" })}
                </span>
                <span className="text-sobre-lavanda text-xs font-semibold">
                  {MESES_CORTOS[Number(enGuatemala(tutoria.fechaInicio, { month: "numeric" })) - 1]}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3 py-4 pr-5 pl-5 sm:pl-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-texto text-base font-bold">{tutoria.curso.nombre}</p>
                    <p className="text-texto-suave font-mono text-xs">{tutoria.curso.codigo}</p>
                  </div>

                  <EtiquetaEstado tono={TONOS[tutoria.estado]}>
                    {ETIQUETAS_ESTADO_TUTORIA[tutoria.estado]}
                  </EtiquetaEstado>
                </div>

                {/* Con quién: el avatar hace reconocible la ficha de un vistazo. */}
                <div className="flex items-center gap-3">
                  <Avatar nombre={otro.nombre} fotoUrl={otro.fotoUrl} tamano="size-10 text-xs" />
                  <div className="min-w-0">
                    <p className="text-texto truncate text-sm font-semibold">{otro.nombre}</p>
                    <p className="text-texto-suave text-xs">
                      {otro.papel} · <span className="font-mono">{otro.carnet}</span>
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Dato trazo={TRAZO_RELOJ}>
                    {formatearHora12(horaDelPais(tutoria.fechaInicio))} a{" "}
                    {formatearHora12(horaDelPais(tutoria.fechaFin))}
                    <span className="block text-xs">
                      {duracionDe(tutoria.fechaInicio, tutoria.fechaFin)} ·{" "}
                      {ETIQUETAS_MODALIDAD[tutoria.modalidad]}
                    </span>
                  </Dato>

                  {tutoria.ubicacionEnlace && (
                    <Dato trazo={TRAZO_LUGAR}>
                      {esEnlace(tutoria.ubicacionEnlace) ? (
                        <a
                          href={tutoria.ubicacionEnlace}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primario font-semibold break-all hover:underline"
                        >
                          Abrir el enlace de la reunión
                        </a>
                      ) : (
                        tutoria.ubicacionEnlace
                      )}
                    </Dato>
                  )}

                  {otro.contacto && (
                    <Dato trazo={TRAZO_NOTA}>
                      <span className="break-all">{otro.contacto}</span>
                    </Dato>
                  )}
                </div>

                {tutoria.observaciones && (
                  <div className="border-borde bg-superficie-suave rounded-2xl border px-4 py-3">
                    <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">
                      Qué quiere repasar
                    </p>
                    <p className="text-texto-suave mt-1 text-sm leading-relaxed">
                      {tutoria.observaciones}
                    </p>
                  </div>
                )}

                <AccionesTutoria tutoria={tutoria} comoTutor={comoTutor} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
