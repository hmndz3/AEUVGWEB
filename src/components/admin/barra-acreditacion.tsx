"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { formatearHoras } from "@/lib/horas-beca/formato-horas";
import type { AccionAcreditacion } from "@/validators/hora-beca-admin";

const CONFIRMACIONES: Record<AccionAcreditacion, (cantidad: number) => string> = {
  acreditar: (cantidad) =>
    `Se acreditarán ${cantidad} ${cantidad === 1 ? "registro" : "registros"} con la fecha de hoy y quedarán a tu nombre. ¿Continuar?`,
  revertir: (cantidad) =>
    `${cantidad} ${cantidad === 1 ? "registro volverá" : "registros volverán"} a pendiente y perderán su fecha de acreditación. ¿Continuar?`,
};

/** Cómo se lee el resultado cuando la selección mezclaba estados. */
function resumenDelResultado(
  accion: AccionAcreditacion,
  solicitados: number,
  afectados: number
): string {
  const verbo = accion === "acreditar" ? "acreditaron" : "devolvieron a pendiente";

  if (afectados === 0) {
    return accion === "acreditar"
      ? "Ningún registro cambió: los seleccionados ya estaban acreditados."
      : "Ningún registro cambió: los seleccionados ya estaban pendientes.";
  }

  if (afectados === solicitados) {
    return `Se ${verbo} ${afectados} ${afectados === 1 ? "registro" : "registros"}.`;
  }

  return `Se ${verbo} ${afectados} de ${solicitados} registros; el resto ya estaba en ese estado.`;
}

/**
 * Barra de operaciones en lote del panel de horas beca.
 *
 * Presenta cuántos registros hay seleccionados y cuántas horas suman antes de
 * aplicar nada: acreditar es la operación que deja constancia con fecha y
 * responsable, y quien la aplica necesita ver sobre qué la está aplicando. El
 * resultado informa cuántos registros cambiaron realmente, porque una selección
 * puede mezclar pendientes y acreditados.
 */
export function BarraAcreditacion({
  seleccionados,
  horasSeleccionadas,
  alLimpiar,
}: {
  seleccionados: number[];
  horasSeleccionadas: number;
  alLimpiar: () => void;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<AccionAcreditacion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cantidad = seleccionados.length;

  async function aplicar(accion: AccionAcreditacion) {
    if (!window.confirm(CONFIRMACIONES[accion](cantidad))) return;

    setTrabajando(accion);
    setAviso(null);
    setError(null);

    try {
      const respuesta = await fetch("/api/admin/horas-beca/acreditacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ids: seleccionados }),
      });

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        mensaje?: string;
        errores?: Record<string, string>;
        solicitados?: number;
        afectados?: number;
      };

      if (!respuesta.ok) {
        setError(
          cuerpo.mensaje ??
            Object.values(cuerpo.errores ?? {})[0] ??
            "No se pudo aplicar la operación."
        );
        return;
      }

      setAviso(resumenDelResultado(accion, cuerpo.solicitados ?? cantidad, cuerpo.afectados ?? 0));
      // La selección se descarta tras aplicar: las filas ya cambiaron de estado
      // y volver a pulsar el botón no tendría ningún efecto.
      alLimpiar();
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-borde bg-superficie flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-4">
        <p className="text-texto text-sm" aria-live="polite">
          {cantidad === 0 ? (
            <span className="text-texto-suave">
              Marca los registros sobre los que quieras aplicar una operación.
            </span>
          ) : (
            <>
              <span className="font-bold">
                {cantidad} {cantidad === 1 ? "registro seleccionado" : "registros seleccionados"}
              </span>
              <span className="text-texto-suave">
                {" "}
                · {formatearHoras(horasSeleccionadas)} {horasSeleccionadas === 1 ? "hora" : "horas"}
              </span>
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Boton
            tamano="sm"
            disabled={cantidad === 0}
            cargando={trabajando === "acreditar"}
            onClick={() => aplicar("acreditar")}
          >
            Acreditar
          </Boton>
          <Boton
            tamano="sm"
            variante="contorno"
            disabled={cantidad === 0}
            cargando={trabajando === "revertir"}
            onClick={() => aplicar("revertir")}
          >
            Revertir
          </Boton>
          {cantidad > 0 && (
            <Boton tamano="sm" variante="texto" onClick={alLimpiar}>
              Limpiar selección
            </Boton>
          )}
        </div>
      </div>

      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}
    </div>
  );
}
