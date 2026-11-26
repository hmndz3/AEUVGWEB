"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type { ComprobantePanel } from "@/lib/prestamo-batas/consultas-prestamo-batas";

const TONOS = {
  PENDIENTE: "pendiente",
  APROBADO: "acreditada",
  RECHAZADO: "error",
} as const;

/**
 * Una de las fotos del turno. Se ve en pequeño y se abre en otra pestaña a
 * tamaño real: la miniatura basta para reconocerla, no para revisarla.
 */
function FotoDelTurno({ titulo, url }: { titulo: string; url: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</span>

      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <Image
            src={url}
            alt={titulo}
            width={320}
            height={200}
            unoptimized
            className="border-borde h-32 w-full rounded-2xl border object-cover"
          />
        </a>
      ) : (
        <div className="border-borde text-texto-suave flex h-32 items-center justify-center rounded-2xl border border-dashed text-xs">
          Sin foto
        </div>
      )}
    </div>
  );
}

function TarjetaComprobante({
  comprobante,
  revisable,
}: {
  comprobante: ComprobantePanel;
  revisable: boolean;
}) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function revisar(decision: "aprobar" | "rechazar") {
    setError(null);
    setProcesando(true);
    try {
      const respuesta = await fetch(
        `/api/admin/prestamo-batas/comprobantes/${comprobante.idComprobante}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, comentarioRevision: comentario }),
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
          "No se pudo revisar el comprobante."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="border-borde bg-superficie flex flex-col gap-3 rounded-[1.25rem] border p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-texto font-bold">{comprobante.voluntario.nombre}</p>
          <p className="text-texto-suave text-sm">
            {comprobante.voluntario.carnet} · {comprobante.turno}
          </p>
        </div>
        <EtiquetaEstado tono={TONOS[comprobante.estado]}>
          {comprobante.etiquetaEstado}
        </EtiquetaEstado>
      </div>

      <p className="text-texto-suave text-sm">
        {comprobante.fecha} · {comprobante.horaEntrada}–{comprobante.horaSalida} ·{" "}
        <span className="text-texto font-semibold">{comprobante.horasTurno} h a acreditar</span>
      </p>

      {/* Las pruebas del turno: una al entrar y otra al salir. Sin ellas no
          hay con qué acreditar las horas, así que se ven antes de decidir. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FotoDelTurno titulo="Foto de entrada" url={comprobante.fotoInicioUrl} />
        <FotoDelTurno titulo="Foto de salida" url={comprobante.fotoFinUrl} />
      </div>

      {comprobante.comentarioVoluntario && (
        <p className="text-texto-suave bg-superficie-suave rounded-2xl px-4 py-3 text-sm">
          {comprobante.comentarioVoluntario}
        </p>
      )}

      {!revisable && comprobante.comentarioRevision && (
        <p className="text-texto-suave text-sm italic">{comprobante.comentarioRevision}</p>
      )}

      {error && <Alerta tipo="error">{error}</Alerta>}

      {revisable && (
        <>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Comentario para el voluntario (opcional)."
            className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
          />
          <div className="flex gap-3">
            <Boton type="button" cargando={procesando} onClick={() => revisar("aprobar")}>
              Aprobar y acreditar horas
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
        </>
      )}
    </div>
  );
}

/** Comprobantes de entrada y salida para que AEUVG los revise y acredite. */
export function ListaComprobantes({
  comprobantes,
  revisable = false,
  vacio,
}: {
  comprobantes: ComprobantePanel[];
  revisable?: boolean;
  vacio: string;
}) {
  if (comprobantes.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        {vacio}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {comprobantes.map((comprobante) => (
        <TarjetaComprobante
          key={comprobante.idComprobante}
          comprobante={comprobante}
          revisable={revisable}
        />
      ))}
    </div>
  );
}
