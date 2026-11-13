"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import type { TutorVista } from "@/lib/tutorias/consultas-tutorias";
import {
  ETIQUETAS_DIA,
  ETIQUETAS_MODALIDAD,
  formatearRangoHoras,
} from "@/lib/tutorias/formato-tutorias";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/** El día de hoy en Guatemala, como mínimo del campo de fecha. */
function hoyEnGuatemala(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Guatemala",
  }).format(new Date());
}

/**
 * Solicitud de una tutoría.
 *
 * Se elige primero la franja y después el día, no al revés: la disponibilidad
 * del tutor es por día de la semana, así que la franja es la que acota a qué
 * días se puede y con qué modalidad. Elegir el día primero obligaría a probar
 * fechas hasta dar con una que el tutor tuviera libre.
 */
export function FormularioSolicitud({
  tutor,
  conSesion,
}: {
  tutor: TutorVista;
  conSesion: boolean;
}) {
  const router = useRouter();
  const [idCurso, setIdCurso] = useState(String(tutor.cursos[0]?.idCurso ?? ""));
  const [indiceFranja, setIndiceFranja] = useState("0");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const franja = tutor.disponibilidades[Number(indiceFranja)];

  /** Al cambiar de franja se heredan sus horas y su modalidad como punto de partida. */
  function elegirFranja(indice: string) {
    setIndiceFranja(indice);
    const elegida = tutor.disponibilidades[Number(indice)];
    if (!elegida) return;

    setHoraInicio(elegida.horaInicio);
    setHoraFin(elegida.horaFin);
    setModalidad(elegida.modalidad === "AMBAS" ? "PRESENCIAL" : elegida.modalidad);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setGeneral(null);

    try {
      const respuesta = await fetch("/api/tutorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTutor: tutor.idTutor,
          idCurso,
          fecha,
          horaInicio,
          horaFin,
          modalidad,
          observaciones,
        }),
      });

      if (respuesta.ok) {
        setListo(true);
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      setGeneral(
        cuerpo.errores?.general ??
          Object.values(cuerpo.errores ?? {})[0] ??
          cuerpo.mensaje ??
          "No se pudo agendar la tutoría."
      );
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  }

  if (!conSesion) {
    return (
      <Alerta tipo="informativo" titulo="Inicia sesión para solicitar una tutoría">
        Necesitas una cuenta de la plataforma para agendar con {tutor.nombreCompleto}.
      </Alerta>
    );
  }

  if (tutor.disponibilidades.length === 0) {
    return (
      <Alerta tipo="informativo" titulo="Este tutor todavía no publicó sus horarios">
        Puedes escribirle por los medios de contacto de su ficha mientras tanto.
      </Alerta>
    );
  }

  if (listo) {
    return (
      <Alerta tipo="exito" titulo="Tutoría agendada">
        Queda programada con {tutor.nombreCompleto}. La encuentras en tu perfil, en la sección de
        tutorías, con el lugar o el enlace donde presentarte.
      </Alerta>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="idCurso" obligatorio>
          Curso
        </EtiquetaCampo>
        <select
          id="idCurso"
          value={idCurso}
          onChange={(evento) => setIdCurso(evento.target.value)}
          className={claseCampo}
        >
          {tutor.cursos.map((curso) => (
            <option key={curso.idCurso} value={curso.idCurso}>
              {curso.codigo} · {curso.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="franja" obligatorio>
          Horario del tutor
        </EtiquetaCampo>
        <select
          id="franja"
          value={indiceFranja}
          onChange={(evento) => elegirFranja(evento.target.value)}
          className={claseCampo}
        >
          {tutor.disponibilidades.map((opcion, indice) => (
            <option key={opcion.idDisponibilidad} value={indice}>
              {ETIQUETAS_DIA[opcion.diaSemana]} de{" "}
              {formatearRangoHoras(opcion.horaInicio, opcion.horaFin)} ·{" "}
              {ETIQUETAS_MODALIDAD[opcion.modalidad]}
            </option>
          ))}
        </select>
        {franja && (
          <p className="text-texto-suave text-xs">
            Elige un {ETIQUETAS_DIA[franja.diaSemana].toLocaleLowerCase("es")} y una hora dentro de
            esa franja.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="fecha" obligatorio>
            Día
          </EtiquetaCampo>
          <input
            id="fecha"
            type="date"
            min={hoyEnGuatemala()}
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className={claseCampo}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="horaInicio" obligatorio>
            De
          </EtiquetaCampo>
          <input
            id="horaInicio"
            type="time"
            step={300}
            min={franja?.horaInicio}
            max={franja?.horaFin}
            value={horaInicio}
            onChange={(evento) => setHoraInicio(evento.target.value)}
            className={claseCampo}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="horaFin" obligatorio>
            A
          </EtiquetaCampo>
          <input
            id="horaFin"
            type="time"
            step={300}
            min={franja?.horaInicio}
            max={franja?.horaFin}
            value={horaFin}
            onChange={(evento) => setHoraFin(evento.target.value)}
            className={claseCampo}
          />
        </div>
      </div>

      {franja?.modalidad === "AMBAS" && (
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="modalidad" obligatorio>
            Modalidad
          </EtiquetaCampo>
          <select
            id="modalidad"
            value={modalidad}
            onChange={(evento) => setModalidad(evento.target.value)}
            className={claseCampo}
          >
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="observaciones">Qué te gustaría repasar</EtiquetaCampo>
        <textarea
          id="observaciones"
          value={observaciones}
          onChange={(evento) => setObservaciones(evento.target.value)}
          rows={3}
          maxLength={1000}
          className={claseCampo}
        />
        <p className="text-texto-suave text-xs">
          Opcional, pero ayuda al tutor a llegar preparado.
        </p>
      </div>

      <div>
        <Boton
          type="submit"
          disabled={!fecha || !horaInicio || !horaFin || !idCurso}
          cargando={enviando}
        >
          Agendar tutoría
        </Boton>
      </div>
    </form>
  );
}
