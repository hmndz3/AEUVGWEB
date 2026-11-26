"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import type {
  PostulacionPanel,
  TurnoSolicitado,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

function TarjetaPostulacion({ postulacion }: { postulacion: PostulacionPanel }) {
  const router = useRouter();
  // Solo se preseleccionan los turnos con cupo libre; los llenos no se pueden
  // asignar aunque el estudiante los haya pedido.
  const asignables = postulacion.turnos.filter((t) => t.asignadosActivos < t.cupo);
  const [seleccion, setSeleccion] = useState<Set<number>>(
    new Set(asignables.map((t) => t.idTurno))
  );
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  function alternar(idTurno: number) {
    setSeleccion((previo) => {
      const copia = new Set(previo);
      if (copia.has(idTurno)) copia.delete(idTurno);
      else copia.add(idTurno);
      return copia;
    });
  }

  async function revisar(decision: "aprobar" | "rechazar") {
    if (decision === "aprobar" && seleccion.size === 0) {
      setError("Elige al menos un turno para asignar al voluntario.");
      return;
    }
    setError(null);
    setProcesando(true);

    try {
      const respuesta = await fetch(
        `/api/admin/prestamo-batas/postulaciones/${postulacion.idPostulacion}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            idsTurnos: decision === "aprobar" ? [...seleccion] : [],
            comentarioRevision: comentario,
          }),
        }
      );

      if (respuesta.ok) {
        router.refresh();
        return;
      }
      const datos = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(datos.errores ?? {})[0] ??
          datos.mensaje ??
          "No se pudo revisar la postulación."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-texto font-bold">{postulacion.estudiante.nombre}</p>
          <p className="text-texto-suave text-sm">
            {postulacion.estudiante.carnet} · {postulacion.estudiante.carrera}
          </p>
        </div>
        <span className="text-texto-suave text-xs">{postulacion.fecha}</span>
      </div>

      {postulacion.comentario && (
        <p className="text-texto-suave bg-superficie-suave rounded-2xl px-4 py-3 text-sm">
          {postulacion.comentario}
        </p>
      )}

      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="flex flex-col gap-2">
        <p className="text-texto text-sm font-semibold">Turnos solicitados</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {postulacion.turnos.map((turno: TurnoSolicitado) => {
            const lleno = turno.asignadosActivos >= turno.cupo;
            return (
              <label
                key={turno.idTurno}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm ${
                  lleno
                    ? "border-borde bg-superficie-suave cursor-not-allowed opacity-60"
                    : "border-borde bg-superficie hover:bg-superficie-suave cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={lleno}
                  checked={seleccion.has(turno.idTurno)}
                  onChange={() => alternar(turno.idTurno)}
                  className="accent-primario size-4"
                />
                <span className="text-texto font-semibold">
                  {turno.etiquetaDia}, {turno.rango}
                </span>
                <span className="text-texto-suave ml-auto text-xs">
                  {lleno ? "Lleno" : `${turno.asignadosActivos}/${turno.cupo}`}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Comentario para el estudiante (opcional)."
        className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
      />

      <div className="flex gap-3">
        <Boton type="button" cargando={procesando} onClick={() => revisar("aprobar")}>
          Aprobar y asignar
        </Boton>
        <Boton
          type="button"
          variante="contorno"
          disabled={procesando}
          onClick={() => revisar("rechazar")}
        >
          Rechazar
        </Boton>
      </div>
    </div>
  );
}

/** Postulaciones de voluntarios pendientes de revisión por AEUVG. */
export function ListaPostulacionesVoluntario({
  postulaciones,
}: {
  postulaciones: PostulacionPanel[];
}) {
  if (postulaciones.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        No hay postulaciones pendientes.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {postulaciones.map((postulacion) => (
        <TarjetaPostulacion key={postulacion.idPostulacion} postulacion={postulacion} />
      ))}
    </div>
  );
}
