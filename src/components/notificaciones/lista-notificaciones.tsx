"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { formatearFechaAcreditacion } from "@/lib/horas-beca/formato-horas";
import type { NotificacionVista } from "@/lib/notificaciones/consultas-notificaciones";
import {
  ETIQUETAS_TIPO_NOTIFICACION,
  TIPOS_NOTIFICACION,
} from "@/lib/notificaciones/tipos-notificacion";

/** Un color por tipo, para distinguirlos de un vistazo sin leerlos. */
const TONOS: Record<string, string> = {
  [TIPOS_NOTIFICACION.postulacion]: "bg-lavanda/20 text-[#5a35e8]",
  [TIPOS_NOTIFICACION.tutoria]: "bg-cielo/15 text-[#0b5f8a]",
  [TIPOS_NOTIFICACION.horasBeca]: "bg-turquesa/15 text-[#00695a]",
  [TIPOS_NOTIFICACION.evento]: "bg-magenta/12 text-[#a3145f]",
};

/**
 * Avisos de la cuenta.
 *
 * Marcar como leído es manual y no al abrir la pantalla: quien entra a
 * revisarlos suele querer dejar pendientes los que todavía no resolvió, y
 * marcarlos todos por el hecho de haberlos visto se los esconde.
 */
export function ListaNotificaciones({ notificaciones }: { notificaciones: NotificacionVista[] }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinLeer = notificaciones.filter((aviso) => !aviso.leida).length;

  async function marcar(ruta: string, metodo: "PATCH" | "POST") {
    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch(ruta, { method: metodo });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo marcar la notificación.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  if (notificaciones.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-16 text-center">
        <p className="text-texto text-base font-bold">No tienes notificaciones</p>
        <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Aquí te avisamos cuando AEUVG resuelva una postulación tuya, cuando alguien agende una
          tutoría contigo o cuando te acrediten horas beca.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sinLeer > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-texto-suave text-sm">
            {sinLeer} sin leer de {notificaciones.length}
          </p>
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            cargando={trabajando}
            onClick={() => marcar("/api/notificaciones/leidas", "POST")}
          >
            Marcar todas como leídas
          </Boton>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {notificaciones.map((aviso) => (
          <li
            key={aviso.idNotificacion}
            className={`border-borde rounded-[1.25rem] border p-5 ${
              aviso.leida ? "bg-superficie" : "bg-primario-suave/30 border-primario/30"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      TONOS[aviso.tipo] ?? "bg-superficie-suave text-texto-suave"
                    }`}
                  >
                    {ETIQUETAS_TIPO_NOTIFICACION[aviso.tipo] ?? "Aviso"}
                  </span>
                  {!aviso.leida && (
                    <span className="bg-primario size-2 rounded-full" aria-label="Sin leer" />
                  )}
                </div>

                <p className="text-texto mt-2 font-bold">{aviso.titulo}</p>
                <p className="text-texto-suave mt-1 text-sm leading-relaxed">{aviso.mensaje}</p>
                <p className="text-texto-suave mt-2 text-xs">
                  {formatearFechaAcreditacion(aviso.fechaEnvio)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {aviso.urlDestino && (
                  <Link
                    href={aviso.urlDestino}
                    className="text-primario text-sm font-bold hover:underline"
                  >
                    Ver →
                  </Link>
                )}
                {!aviso.leida && (
                  <button
                    type="button"
                    disabled={trabajando}
                    onClick={() => marcar(`/api/notificaciones/${aviso.idNotificacion}`, "PATCH")}
                    className="text-texto-suave hover:text-texto text-xs font-semibold disabled:opacity-50"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-error text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
