"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { formatearFechaAcreditacion } from "@/lib/horas-beca/formato-horas";
import type { NotificacionVista } from "@/lib/notificaciones/consultas-notificaciones";
import {
  ETIQUETAS_TIPO_NOTIFICACION,
  EVENTO_NOTIFICACIONES,
  TIPOS_NOTIFICACION,
} from "@/lib/notificaciones/tipos-notificacion";

/** Un color por tipo, para distinguirlos de un vistazo sin leerlos. */
const TONOS: Record<string, string> = {
  [TIPOS_NOTIFICACION.postulacion]: "bg-lavanda/20 text-sobre-lavanda",
  [TIPOS_NOTIFICACION.tutoria]: "bg-cielo/15 text-sobre-cielo",
  [TIPOS_NOTIFICACION.horasBeca]: "bg-turquesa/15 text-sobre-turquesa",
  [TIPOS_NOTIFICACION.evento]: "bg-magenta/12 text-sobre-magenta",
};

/**
 * Avisos de la cuenta.
 *
 * Un aviso se marca como leído al abrirlo, no al entrar a la pantalla: quien
 * revisa la lista suele dejar pendientes los que todavía no resolvió, y
 * marcarlos todos por haberlos visto se los esconde. Abrir uno, en cambio, es
 * haberlo revisado, y pedir además que se marque a mano sobraba.
 */
export function ListaNotificaciones({ notificaciones }: { notificaciones: NotificacionVista[] }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Se marcan aquí en cuanto se abren, para no esperar a que la página se
  // vuelva a pedir antes de quitarles el resaltado.
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set());

  const leida = (aviso: NotificacionVista) => aviso.leida || abiertas.has(aviso.idNotificacion);
  const sinLeer = notificaciones.filter((aviso) => !leida(aviso)).length;

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

      window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  /**
   * Abre el aviso: lo marca como leído y, si lleva a algún lado, va hacia allá.
   * La marca se envía con keepalive para que no se pierda al cambiar de página.
   */
  function abrir(aviso: NotificacionVista) {
    if (!leida(aviso)) {
      setAbiertas((previas) => new Set(previas).add(aviso.idNotificacion));
      fetch(`/api/notificaciones/${aviso.idNotificacion}`, { method: "PATCH", keepalive: true })
        .then((respuesta) => {
          if (respuesta.ok) window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));
        })
        .catch(() => {
          // Si la marca no llega, el aviso vuelve a aparecer sin leer la
          // próxima vez: no vale la pena interrumpir la navegación por eso.
        });
    }

    if (aviso.urlDestino) router.push(aviso.urlDestino);
    else router.refresh();
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
        {notificaciones.map((aviso) => {
          const esLeida = leida(aviso);

          return (
            <li key={aviso.idNotificacion}>
              <button
                type="button"
                onClick={() => abrir(aviso)}
                className={`border-borde hover:border-primario/50 focus-visible:ring-primario/30 w-full rounded-[1.25rem] border p-5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                  esLeida ? "bg-superficie" : "bg-primario-suave/30 border-primario/30"
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
                      {!esLeida && (
                        <span className="bg-primario size-2 rounded-full" aria-label="Sin leer" />
                      )}
                    </div>

                    <p className="text-texto mt-2 font-bold">{aviso.titulo}</p>
                    <p className="text-texto-suave mt-1 text-sm leading-relaxed">{aviso.mensaje}</p>
                    <p className="text-texto-suave mt-2 text-xs">
                      {formatearFechaAcreditacion(aviso.fechaEnvio)}
                    </p>
                  </div>

                  {aviso.urlDestino && (
                    <span className="text-primario text-sm font-bold">Ver →</span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="text-error text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
