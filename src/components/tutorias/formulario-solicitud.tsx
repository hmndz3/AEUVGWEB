"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorHora } from "@/components/ui/selector-hora";
import { franjaDelRango, franjasDelDia, NUMERO_DE_DIA } from "@/lib/tutorias/agenda-tutorias";
import type { TutorVista } from "@/lib/tutorias/consultas-tutorias";
import { hoyEnGuatemala } from "@/lib/ui/calendario-selector";
import {
  ETIQUETAS_DIA,
  ETIQUETAS_MODALIDAD,
  formatearRangoHoras,
} from "@/lib/tutorias/formato-tutorias";

/** "lunes", "lunes y jueves", "lunes, martes y jueves". */
function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");

  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Solicitud de una tutoría.
 *
 * Se elige el día y la hora, nada más: la disponibilidad que el tutor publicó
 * ya está a la vista en su ficha, así que el formulario la usa para acotar —el
 * calendario solo abre los días que atiende y el reloj solo ofrece sus horas—
 * en lugar de hacer que el estudiante elija primero una franja y después
 * repita esa misma información abajo.
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
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [modalidadElegida, setModalidadElegida] = useState("PRESENCIAL");
  const [observaciones, setObservaciones] = useState("");
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  // Todos los días de la semana que el tutor atiende: son los únicos que el
  // calendario deja abrir.
  const diasPermitidos = useMemo(
    () => [...new Set(tutor.disponibilidades.map((franja) => NUMERO_DE_DIA[franja.diaSemana]))],
    [tutor.disponibilidades]
  );

  // Las franjas que caen en el día elegido. Un tutor puede tener más de una el
  // mismo día, por ejemplo una por la mañana y otra por la tarde.
  const franjasDeHoy = useMemo(
    () => (fecha ? franjasDelDia(tutor.disponibilidades, fecha) : []),
    [fecha, tutor.disponibilidades]
  );

  // El reloj se abre desde la primera hora del día hasta la última. Si hay un
  // hueco entre dos franjas, lo atrapa la comprobación de abajo.
  const limiteInicio = franjasDeHoy.reduce<string | undefined>(
    (menor, franja) => (!menor || franja.horaInicio < menor ? franja.horaInicio : menor),
    undefined
  );
  const limiteFin = franjasDeHoy.reduce<string | undefined>(
    (mayor, franja) => (!mayor || franja.horaFin > mayor ? franja.horaFin : mayor),
    undefined
  );

  /** La franja que contiene entero el rango pedido, que es la que se agenda. */
  const franja = fecha ? franjaDelRango(tutor.disponibilidades, fecha, horaInicio, horaFin) : null;

  const modalidad = !franja
    ? ""
    : franja.modalidad === "AMBAS"
      ? modalidadElegida
      : franja.modalidad;

  const horarioFueraDeFranja = Boolean(fecha && horaInicio && horaFin && !franja);

  /** Al elegir el día se parte de su primera franja: casi siempre es la buena. */
  function elegirFecha(iso: string) {
    setFecha(iso);

    const [primera] = franjasDelDia(tutor.disponibilidades, iso);

    setHoraInicio(primera?.horaInicio ?? "");
    setHoraFin(primera?.horaFin ?? "");
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

  const diasQueAtiende = [
    ...new Set(tutor.disponibilidades.map((opcion) => ETIQUETAS_DIA[opcion.diaSemana])),
  ];

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <EtiquetaCampo htmlFor="fecha" obligatorio>
            Día
          </EtiquetaCampo>
          {/* El calendario solo deja elegir los días en los que el tutor
              atiende: ofrecer el resto llevaría a pedir una fecha que el
              servidor va a rechazar. */}
          <SelectorFecha
            id="fecha"
            valor={fecha}
            onCambiar={elegirFecha}
            limites={{ minimo: hoyEnGuatemala(), diasPermitidos }}
            placeholder="Elige el día"
          />
          <p className="text-texto-suave text-xs">
            {franjasDeHoy.length > 0
              ? `Ese día atiende de ${enumerar(
                  franjasDeHoy.map((opcion) =>
                    formatearRangoHoras(opcion.horaInicio, opcion.horaFin)
                  )
                )}.`
              : `Atiende los ${enumerar(diasQueAtiende).toLocaleLowerCase("es")}.`}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="horaInicio" obligatorio>
            De
          </EtiquetaCampo>
          <SelectorHora
            id="horaInicio"
            valor={horaInicio}
            onCambiar={setHoraInicio}
            minimo={limiteInicio}
            maximo={limiteFin}
            paso={30}
            invalido={horarioFueraDeFranja}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="horaFin" obligatorio>
            A
          </EtiquetaCampo>
          <SelectorHora
            id="horaFin"
            valor={horaFin}
            onCambiar={setHoraFin}
            minimo={horaInicio || limiteInicio}
            maximo={limiteFin}
            paso={30}
            invalido={horarioFueraDeFranja}
          />
        </div>

        {horarioFueraDeFranja && (
          <p className="text-error text-xs sm:col-span-2">
            Ese rango no cabe entero en ninguno de los horarios que el tutor publicó para ese día.
          </p>
        )}
      </div>

      {franja?.modalidad === "AMBAS" && (
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="modalidad" obligatorio>
            Modalidad
          </EtiquetaCampo>
          <select
            id="modalidad"
            value={modalidadElegida}
            onChange={(evento) => setModalidadElegida(evento.target.value)}
            className={claseCampo}
          >
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
      )}

      {franja && franja.modalidad !== "AMBAS" && (
        <p className="text-texto-suave text-xs">
          Esa tutoría es {ETIQUETAS_MODALIDAD[franja.modalidad].toLocaleLowerCase("es")}
          {franja.ubicacionEnlace ? ` · ${franja.ubicacionEnlace}` : ""}.
        </p>
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
        <Boton type="submit" disabled={!franja || !idCurso} cargando={enviando}>
          Agendar tutoría
        </Boton>
      </div>
    </form>
  );
}
