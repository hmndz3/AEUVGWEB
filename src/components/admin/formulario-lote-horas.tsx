"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { MAXIMO_CARNETS_LOTE } from "@/lib/horas-beca/carnets-lote";
import { componerHorario } from "@/lib/horas-beca/formato-horas";
import { MAXIMO_HORAS_POR_REGISTRO } from "@/lib/horas-beca/servicio-horas-beca";

type Revision = {
  encontrados: { carnet: string; nombreEstudiante: string | null }[];
  sinCuenta: string[];
  invalidos: string[];
  repetidos: string[];
};

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

function Campo({
  etiqueta,
  nombre,
  error,
  ayuda,
  clase,
  obligatorio = false,
  children,
}: {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  clase?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${clase ?? ""}`}>
      <EtiquetaCampo htmlFor={nombre} obligatorio={obligatorio}>
        {etiqueta}
      </EtiquetaCampo>
      {children}
      {ayuda && !error && <p className="text-texto-suave text-xs">{ayuda}</p>}
      {error && (
        <p role="alert" className="text-error text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

/** Una ficha de carnet, del color que corresponde a su estado. */
function Ficha({ texto, detalle, tono }: { texto: string; detalle?: string; tono: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tono}`}
    >
      <span className="font-mono font-bold">{texto}</span>
      {detalle && <span className="font-normal opacity-80">{detalle}</span>}
    </span>
  );
}

/**
 * Registro de la misma actividad para varios estudiantes.
 *
 * Los carnets se pegan en un solo campo, como los destinatarios de un correo:
 * una actividad la realizan veinte personas el mismo día y en lo mismo, y
 * capturar veinte veces los mismos cinco campos es donde aparecen los errores
 * de dedo.
 *
 * La lista se revisa antes de guardar y se presenta como fichas con el nombre
 * de cada quien, de modo que un carnet mal escrito se vea antes de registrarle
 * horas a otra persona. Se admiten comas, espacios y saltos de línea, porque
 * los carnets llegan pegados de una columna de Excel o de un mensaje.
 */
export function FormularioLoteHoras({ destino }: { destino: string }) {
  const router = useRouter();
  const [carnets, setCarnets] = useState("");
  const [revision, setRevision] = useState<Revision | null>(null);
  const [valores, setValores] = useState({
    fechaActividad: "",
    horaInicio: "",
    horaFin: "",
    descripcionActividad: "",
    cantidadHoras: "",
    observaciones: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave: keyof typeof valores, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  async function revisar() {
    setRevisando(true);
    setGeneral(null);

    try {
      const respuesta = await fetch("/api/admin/horas-beca/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "revisar", carnets }),
      });

      if (!respuesta.ok) {
        setGeneral("No se pudo revisar la lista de carnets.");
        return;
      }

      setRevision((await respuesta.json()) as Revision);
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setRevisando(false);
    }
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const respuesta = await fetch("/api/admin/horas-beca/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "registrar",
          carnets,
          fechaActividad: valores.fechaActividad,
          horarioApoyo: componerHorario(valores.horaInicio, valores.horaFin),
          descripcionActividad: valores.descripcionActividad,
          cantidadHoras: valores.cantidadHoras,
          observaciones: valores.observaciones,
        }),
      });

      if (respuesta.ok) {
        router.push(destino);
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
        setErrores(cuerpo.errores);
        setGeneral(Object.values(cuerpo.errores)[0]);
        return;
      }

      setGeneral(cuerpo.mensaje ?? "No se pudieron registrar las horas. Intenta de nuevo.");
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  const listos = revision?.encontrados.length ?? 0;
  const conProblemas = (revision?.sinCuenta.length ?? 0) + (revision?.invalidos.length ?? 0);
  const puedeGuardar = listos > 0 && conProblemas === 0;

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <NotaCamposObligatorios />

      <Campo
        etiqueta="Carnets de los estudiantes"
        obligatorio
        nombre="carnets"
        error={errores.carnets}
        ayuda={`Pega los carnets separados por comas, espacios o saltos de línea. Hasta ${MAXIMO_CARNETS_LOTE} a la vez.`}
      >
        <textarea
          id="carnets"
          value={carnets}
          onChange={(evento) => {
            setCarnets(evento.target.value);
            setRevision(null);
          }}
          onBlur={() => carnets.trim().length > 0 && revision === null && revisar()}
          rows={4}
          required
          placeholder={"24117, 24263, 24518\n24890"}
          className={`${claseCampo} font-mono`}
        />
      </Campo>

      <div className="flex flex-wrap items-center gap-3">
        <Boton
          type="button"
          variante="contorno"
          disabled={carnets.trim().length === 0}
          cargando={revisando}
          onClick={revisar}
        >
          Revisar lista
        </Boton>
        {revision && (
          <p className="text-texto-suave text-sm">
            {listos} {listos === 1 ? "estudiante encontrado" : "estudiantes encontrados"}
            {conProblemas > 0 && ` · ${conProblemas} por revisar`}
          </p>
        )}
      </div>

      {revision && (
        <div className="border-borde bg-superficie-suave flex flex-col gap-3 rounded-[1.25rem] border p-4">
          {listos > 0 && (
            <div className="flex flex-wrap gap-2">
              {revision.encontrados.map((item) => (
                <Ficha
                  key={item.carnet}
                  texto={item.carnet}
                  detalle={item.nombreEstudiante ?? undefined}
                  tono="bg-turquesa/15 text-[#00695a]"
                />
              ))}
            </div>
          )}

          {revision.sinCuenta.length > 0 && (
            <div>
              <p className="text-texto text-xs font-bold">Todavía no tienen cuenta</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {revision.sinCuenta.map((carnet) => (
                  <Ficha key={carnet} texto={carnet} tono="bg-ambar/15 text-[#8a5600]" />
                ))}
              </div>
              <p className="text-texto-suave mt-1.5 text-xs leading-relaxed">
                Aquí no se puede escribir su nombre. Regístrales las horas una por una, o cárgalas
                desde Excel.
              </p>
            </div>
          )}

          {revision.invalidos.length > 0 && (
            <div>
              <p className="text-texto text-xs font-bold">No pueden ser un carnet</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {revision.invalidos.map((valor) => (
                  <Ficha key={valor} texto={valor} tono="bg-error/15 text-error" />
                ))}
              </div>
            </div>
          )}

          {revision.repetidos.length > 0 && (
            <p className="text-texto-suave text-xs">
              Se ignoraron por venir repetidos: {revision.repetidos.join(", ")}.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-4">
        <Campo
          etiqueta="Fecha de la actividad"
          obligatorio
          nombre="fechaActividad"
          error={errores.fechaActividad}
        >
          <input
            id="fechaActividad"
            type="date"
            value={valores.fechaActividad}
            onChange={(evento) => cambiar("fechaActividad", evento.target.value)}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Horario de apoyo"
          obligatorio
          nombre="horaInicio"
          error={errores.horarioApoyo}
          clase="md:col-span-2"
          ayuda="Hora de inicio y hora de fin."
        >
          <div className="flex items-start gap-2">
            <input
              id="horaInicio"
              type="time"
              value={valores.horaInicio}
              onChange={(evento) => cambiar("horaInicio", evento.target.value)}
              aria-label="Hora de inicio"
              required
              className={`${claseCampo} min-w-0 flex-1`}
            />
            <span className="text-texto-suave pt-3 text-sm">a</span>
            <input
              id="horaFin"
              type="time"
              value={valores.horaFin}
              onChange={(evento) => cambiar("horaFin", evento.target.value)}
              aria-label="Hora de fin"
              required
              className={`${claseCampo} min-w-0 flex-1`}
            />
          </div>
        </Campo>

        <Campo
          etiqueta="Horas"
          obligatorio
          nombre="cantidadHoras"
          error={errores.cantidadHoras}
          ayuda="Para cada uno."
        >
          <input
            id="cantidadHoras"
            type="number"
            min={0.25}
            max={MAXIMO_HORAS_POR_REGISTRO}
            step={0.25}
            value={valores.cantidadHoras}
            onChange={(evento) => cambiar("cantidadHoras", evento.target.value)}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Actividad"
          obligatorio
          nombre="descripcionActividad"
          error={errores.descripcionActividad}
          clase="md:col-span-4"
          ayuda="En qué apoyaron. Se guarda igual para todos."
        >
          <input
            id="descripcionActividad"
            value={valores.descripcionActividad}
            onChange={(evento) => cambiar("descripcionActividad", evento.target.value)}
            maxLength={1000}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Observaciones"
          nombre="observaciones"
          error={errores.observaciones}
          clase="md:col-span-4"
          ayuda="Opcional."
        >
          <textarea
            id="observaciones"
            value={valores.observaciones}
            onChange={(evento) => cambiar("observaciones", evento.target.value)}
            rows={2}
            maxLength={1000}
            className={claseCampo}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" disabled={!puedeGuardar} cargando={guardando}>
          {puedeGuardar
            ? `Registrar horas para ${listos} ${listos === 1 ? "estudiante" : "estudiantes"}`
            : "Registrar horas"}
        </Boton>
        <Boton type="button" variante="contorno" onClick={() => router.push(destino)}>
          Cancelar
        </Boton>
      </div>

      {!puedeGuardar && (
        <p className="text-texto-suave text-xs">
          {conProblemas > 0
            ? "Corrige o quita los carnets señalados para poder registrar."
            : "Revisa la lista de carnets para continuar."}
        </p>
      )}
    </form>
  );
}
