"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { TutorVista } from "@/lib/tutorias/consultas-tutorias";
import { ETIQUETAS_ESTADO_TUTOR, ESTADOS_TUTOR } from "@/lib/tutorias/formato-tutorias";

const TONOS = {
  ACTIVO: "acreditada",
  INACTIVO: "neutro",
  SUSPENDIDO: "error",
} as const;

/**
 * Tutores del directorio, con su estado editable.
 *
 * El estado se cambia desde la fila y no desde una pantalla aparte: es la
 * única operación que AEUVG hace sobre un tutor ya aprobado, y abrir una ficha
 * para un selector de tres opciones sobraba.
 */
export function TablaTutores({ tutores }: { tutores: TutorVista[] }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(idTutor: number, estado: string) {
    setTrabajando(idTutor);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/tutorias/tutores/${idTutor}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo cambiar el estado del tutor.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabla className="min-w-[48rem]">
        <TablaEncabezado>
          <tr>
            <TablaCeldaEncabezado>Tutor</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Cursos</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Franjas</TablaCeldaEncabezado>
            <TablaCeldaEncabezado className="text-right">Tutorías</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          </tr>
        </TablaEncabezado>
        <TablaCuerpo>
          {tutores.map((tutor) => (
            <TablaFila key={tutor.idTutor}>
              <TablaCelda>
                <span className="text-texto block font-semibold">{tutor.nombreCompleto}</span>
                <span className="text-texto-suave block text-xs">
                  <span className="font-mono">{tutor.carnet}</span> · {tutor.carrera}
                </span>
              </TablaCelda>
              <TablaCelda className="text-texto-suave max-w-[18rem] text-sm">
                {tutor.cursos.length === 0
                  ? "—"
                  : tutor.cursos.map((curso) => curso.codigo).join(", ")}
              </TablaCelda>
              <TablaCelda className="text-texto-suave text-right">
                {tutor.disponibilidades.length}
              </TablaCelda>
              <TablaCelda className="text-texto text-right font-semibold">
                {tutor.tutoriasCompletadas}
              </TablaCelda>
              <TablaCelda>
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaEstado tono={TONOS[tutor.estado]}>
                    {ETIQUETAS_ESTADO_TUTOR[tutor.estado]}
                  </EtiquetaEstado>
                  <select
                    aria-label={`Estado de ${tutor.nombreCompleto}`}
                    value={tutor.estado}
                    disabled={trabajando === tutor.idTutor}
                    onChange={(evento) => cambiarEstado(tutor.idTutor, evento.target.value)}
                    className="border-borde bg-superficie text-texto h-9 rounded-full border px-3 text-xs font-semibold"
                  >
                    {ESTADOS_TUTOR.map((estado) => (
                      <option key={estado} value={estado}>
                        {ETIQUETAS_ESTADO_TUTOR[estado]}
                      </option>
                    ))}
                  </select>
                </div>
              </TablaCelda>
            </TablaFila>
          ))}
        </TablaCuerpo>
      </Tabla>

      {error && (
        <p role="alert" className="text-error text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
