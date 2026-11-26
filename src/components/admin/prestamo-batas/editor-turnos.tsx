"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { RejillaTurnos } from "@/components/prestamo-batas/rejilla-turnos";
import { SelectorHora } from "@/components/ui/selector-hora";
import type { TurnoPanel } from "@/lib/prestamo-batas/consultas-prestamo-batas";
import { DIAS_SEMANA, ETIQUETAS_DIA } from "@/lib/tutorias/formato-tutorias";
import type { DiaSemana } from "@prisma/client";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 w-full rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

type Edicion = {
  idTurno: number | null;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

const NUEVO: Edicion = {
  idTurno: null,
  diaSemana: "LUNES",
  horaInicio: "",
  horaFin: "",
  activo: true,
};

/** Catálogo de turnos de atención con sus voluntarios asignados. */
export function EditorTurnos({ turnos }: { turnos: TurnoPanel[] }) {
  const router = useRouter();
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!edicion) return;
    if (!edicion.horaInicio || !edicion.horaFin) {
      setError("Indica la hora de inicio y la de fin.");
      return;
    }
    setError(null);
    setGuardando(true);

    const url =
      edicion.idTurno === null
        ? "/api/admin/prestamo-batas/turnos"
        : `/api/admin/prestamo-batas/turnos/${edicion.idTurno}`;

    try {
      const respuesta = await fetch(url, {
        method: edicion.idTurno === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaSemana: edicion.diaSemana,
          horaInicio: edicion.horaInicio,
          horaFin: edicion.horaFin,
          activo: edicion.activo,
        }),
      });

      if (respuesta.ok) {
        setEdicion(null);
        router.refresh();
        return;
      }
      const datos = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(datos.errores ?? {})[0] ?? datos.mensaje ?? "No se pudo guardar el turno."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(idTurno: number) {
    if (!confirm("¿Eliminar este turno?")) return;
    setError(null);
    try {
      const respuesta = await fetch(`/api/admin/prestamo-batas/turnos/${idTurno}`, {
        method: "DELETE",
      });
      if (respuesta.ok) {
        router.refresh();
        return;
      }
      const datos = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
      setError(datos.mensaje ?? "No se pudo eliminar el turno.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  async function desasignar(idAsignacion: number) {
    if (!confirm("¿Retirar a este voluntario del turno?")) return;
    setError(null);
    try {
      const respuesta = await fetch(`/api/admin/prestamo-batas/asignaciones/${idAsignacion}`, {
        method: "DELETE",
      });
      if (respuesta.ok) {
        router.refresh();
        return;
      }
      const datos = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
      setError(datos.mensaje ?? "No se pudo retirar al voluntario.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  const turnoActivo = turnos.find((turno) => turno.idTurno === seleccionado) ?? null;

  return (
    <div className="flex flex-col gap-5">
      {error && <Alerta tipo="error">{error}</Alerta>}

      {edicion ? (
        <form
          onSubmit={guardar}
          noValidate
          className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5"
        >
          <h3 className="text-texto text-base font-bold">
            {edicion.idTurno === null ? "Nuevo turno" : "Editar turno"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo htmlFor="dia-turno" obligatorio>
                Día
              </EtiquetaCampo>
              <select
                id="dia-turno"
                value={edicion.diaSemana}
                onChange={(e) => setEdicion({ ...edicion, diaSemana: e.target.value as DiaSemana })}
                className={claseCampo}
              >
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia} value={dia}>
                    {ETIQUETAS_DIA[dia]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo htmlFor="inicio-turno" obligatorio>
                Hora de inicio
              </EtiquetaCampo>
              <SelectorHora
                id="inicio-turno"
                valor={edicion.horaInicio}
                onCambiar={(hora) => setEdicion({ ...edicion, horaInicio: hora })}
                paso={15}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo htmlFor="fin-turno" obligatorio>
                Hora de fin
              </EtiquetaCampo>
              <SelectorHora
                id="fin-turno"
                valor={edicion.horaFin}
                onCambiar={(hora) => setEdicion({ ...edicion, horaFin: hora })}
                paso={15}
              />
            </div>
          </div>

          <label className="text-texto flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={edicion.activo}
              onChange={(e) => setEdicion({ ...edicion, activo: e.target.checked })}
              className="accent-primario size-4"
            />
            Activo (acepta postulaciones y se muestra al estudiantado)
          </label>

          <div className="flex gap-3">
            <Boton type="submit" cargando={guardando}>
              Guardar
            </Boton>
            <Boton type="button" variante="contorno" onClick={() => setEdicion(null)}>
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <div>
          <Boton type="button" onClick={() => setEdicion({ ...NUEVO })}>
            Agregar turno
          </Boton>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <p className="text-texto-suave text-xs">
          Ámbar: faltan voluntarios. Turquesa: turno completo. Gris: turno inactivo. Toca una
          casilla para ver el turno y editarlo, o un «+» para abrir un turno nuevo a esa hora.
        </p>

        <RejillaTurnos
          turnos={turnos}
          vacio="No hay turnos todavía. Agrega el primero."
          casilla={(turno) => {
            const lleno = turno.asignados.length >= turno.cupo;

            return (
              <button
                type="button"
                onClick={() => setSeleccionado(turno.idTurno)}
                aria-pressed={turno.idTurno === seleccionado}
                className={`flex h-full w-full flex-col gap-1 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                  turno.idTurno === seleccionado ? "ring-primario ring-2" : ""
                } ${
                  !turno.activo
                    ? "bg-superficie-suave text-texto-suave"
                    : lleno
                      ? "bg-turquesa/15 text-sobre-turquesa"
                      : "bg-ambar/20 text-sobre-ambar"
                }`}
              >
                <span className="font-bold">
                  {turno.asignados.length}/{turno.cupo}
                  {!turno.activo && " · inactivo"}
                </span>
                {turno.asignados.map((asignado) => (
                  <span key={asignado.idAsignacion} className="leading-snug">
                    {asignado.nombre}
                  </span>
                ))}
              </button>
            );
          }}
          casillaVacia={(dia, bloque) => (
            <button
              type="button"
              onClick={() =>
                setEdicion({
                  idTurno: null,
                  diaSemana: dia,
                  horaInicio: bloque.horaInicio,
                  horaFin: bloque.horaFin,
                  activo: true,
                })
              }
              aria-label={`Agregar turno de ${bloque.etiqueta}`}
              className="text-texto-suave hover:bg-superficie-suave flex h-full min-h-10 w-full items-center justify-center rounded-xl text-sm opacity-50 transition-colors hover:opacity-100"
            >
              +
            </button>
          )}
        />

        {turnoActivo && (
          <div className="border-borde bg-superficie flex flex-col gap-3 rounded-[1.25rem] border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-texto text-sm font-bold">
                  {turnoActivo.etiquetaDia}, {turnoActivo.rango}
                </span>
                {!turnoActivo.activo && <EtiquetaEstado tono="neutro">Inactivo</EtiquetaEstado>}
                <span className="text-texto-suave text-xs">
                  {turnoActivo.asignados.length}/{turnoActivo.cupo} voluntarios
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEdicion({
                      idTurno: turnoActivo.idTurno,
                      diaSemana: turnoActivo.dia,
                      horaInicio: turnoActivo.horaInicio,
                      horaFin: turnoActivo.horaFin,
                      activo: turnoActivo.activo,
                    })
                  }
                  className="text-primario text-sm font-bold hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(turnoActivo.idTurno)}
                  className="text-error text-sm font-bold hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {turnoActivo.asignados.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {turnoActivo.asignados.map((asignado) => (
                  <li
                    key={asignado.idAsignacion}
                    className="border-borde bg-superficie-suave flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  >
                    <span className="text-texto font-semibold">{asignado.nombre}</span>
                    <span className="text-texto-suave">{asignado.carnet}</span>
                    <button
                      type="button"
                      onClick={() => desasignar(asignado.idAsignacion)}
                      className="text-error font-bold"
                      aria-label={`Retirar a ${asignado.nombre} del turno`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-texto-suave text-sm">
                Nadie atiende este turno todavía. Asigna voluntarios desde las postulaciones.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
