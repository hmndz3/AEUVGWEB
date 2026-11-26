"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { TutoriaParaRevisar } from "@/lib/tutorias/consultas-tutorias";

const claseTexto =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

const enGuatemala = new Intl.DateTimeFormat("es-GT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Guatemala",
});

const soloHora = new Intl.DateTimeFormat("es-GT", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Guatemala",
});

/**
 * Revisión de las horas beca de una tutoría.
 *
 * AEUVG ve la ficha completa —quién, qué curso, cuándo, cuántas horas— y las
 * tres pruebas: las dos del tutor y la del estudiante. Al aceptarlas, las horas
 * entran al módulo de horas beca del tutor como pendientes de acreditar.
 *
 * Se puede aceptar aunque falte la confirmación del estudiante, porque no
 * siempre entra a la página; la ficha lo señala para que la decisión se tome
 * viéndolo, no sin saberlo.
 */
export function RevisionHorasTutorias({
  pendientes,
  revisadas,
}: {
  pendientes: TutoriaParaRevisar[];
  revisadas: TutoriaParaRevisar[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Pendientes de revisar</h2>

        {pendientes.length === 0 ? (
          <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
            No hay tutorías esperando revisión.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendientes.map((tutoria) => (
              <FichaRevision key={tutoria.idTutoria} tutoria={tutoria} />
            ))}
          </div>
        )}
      </section>

      {revisadas.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-texto text-lg font-bold">Ya revisadas</h2>
          <div className="flex flex-col gap-4">
            {revisadas.map((tutoria) => (
              <FichaRevision key={tutoria.idTutoria} tutoria={tutoria} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FichaRevision({ tutoria }: { tutoria: TutoriaParaRevisar }) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendiente = tutoria.estadoHoras === "PENDIENTE";
  const faltaEstudiante = tutoria.pruebaEstudianteUrl === null;

  async function revisar(decision: "aceptar" | "rechazar") {
    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/tutorias/horas/${tutoria.idTutoria}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comentario }),
      });

      if (respuesta.ok) {
        router.refresh();
        return;
      }

      const datos = (await respuesta.json().catch(() => ({}))) as {
        mensaje?: string;
        errores?: Record<string, string>;
      };
      setError(
        Object.values(datos.errores ?? {})[0] ?? datos.mensaje ?? "No se pudo revisar las horas."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <article className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-texto text-base font-bold">{tutoria.curso.nombre}</p>
          <p className="text-texto-suave font-mono text-xs">{tutoria.curso.codigo}</p>
          <p className="text-texto-suave mt-1 text-sm">
            {enGuatemala.format(tutoria.fechaInicio)} a {soloHora.format(tutoria.fechaFin)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-texto text-xl font-extrabold">
            {tutoria.horas.toFixed(2)} horas
          </span>
          {tutoria.estadoHoras === "ACEPTADAS" && (
            <EtiquetaEstado tono="acreditada">Aceptadas</EtiquetaEstado>
          )}
          {tutoria.estadoHoras === "RECHAZADAS" && (
            <EtiquetaEstado tono="error">Rechazadas</EtiquetaEstado>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Persona papel="Tutor (recibe las horas)" persona={tutoria.tutor} />
        <Persona papel="Estudiante atendido" persona={tutoria.estudiante} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Prueba titulo="Inicio (tutor)" url={tutoria.pruebaInicioUrl} />
        <Prueba titulo="Final (tutor)" url={tutoria.pruebaFinUrl} />
        <Prueba titulo="Confirmación (estudiante)" url={tutoria.pruebaEstudianteUrl} />
      </div>

      {pendiente && faltaEstudiante && (
        <Alerta tipo="advertencia">
          El estudiante todavía no confirma esta tutoría. Puedes aceptar las horas igual, pero
          quedará sin esa prueba.
        </Alerta>
      )}

      {!pendiente && (
        <p className="text-texto-suave text-sm">
          {tutoria.revisor ? `Revisada por ${tutoria.revisor}.` : "Revisada."}
          {tutoria.comentarioRevisionHoras && ` ${tutoria.comentarioRevisionHoras}`}
        </p>
      )}

      {pendiente && (
        <div className="border-borde flex flex-col gap-3 border-t pt-3">
          {error && <Alerta tipo="error">{error}</Alerta>}

          <label
            htmlFor={`comentario-${tutoria.idTutoria}`}
            className="text-texto text-sm font-semibold"
          >
            Comentario (opcional, lo verá el tutor)
          </label>
          <textarea
            id={`comentario-${tutoria.idTutoria}`}
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
            rows={2}
            maxLength={1000}
            className={claseTexto}
          />

          <div className="flex flex-wrap gap-2">
            <Boton
              type="button"
              tamano="sm"
              cargando={trabajando}
              onClick={() => revisar("aceptar")}
            >
              Aceptar las horas
            </Boton>
            <Boton
              type="button"
              variante="contorno"
              tamano="sm"
              disabled={trabajando}
              onClick={() => revisar("rechazar")}
            >
              Rechazar
            </Boton>
          </div>
        </div>
      )}
    </article>
  );
}

function Persona({
  papel,
  persona,
}: {
  papel: string;
  persona: { nombre: string; carnet: string };
}) {
  return (
    <div className="border-borde bg-superficie-suave rounded-2xl border px-4 py-3">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{papel}</p>
      <p className="text-texto mt-1 text-sm font-semibold">{persona.nombre}</p>
      <p className="text-texto-suave font-mono text-xs">{persona.carnet}</p>
    </div>
  );
}

/**
 * Una prueba. Se muestra en pequeño y se abre en otra pestaña a tamaño real:
 * una miniatura basta para reconocerla, pero no para revisarla.
 */
function Prueba({ titulo, url }: { titulo: string; url: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</span>

      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <Image
            src={url}
            alt={`Prueba: ${titulo}`}
            width={320}
            height={200}
            unoptimized
            className="border-borde h-32 w-full rounded-2xl border object-cover"
          />
        </a>
      ) : (
        <div className="border-borde text-texto-suave flex h-32 items-center justify-center rounded-2xl border border-dashed text-xs">
          Sin prueba
        </div>
      )}
    </div>
  );
}
