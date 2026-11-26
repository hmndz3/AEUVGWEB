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
import type { CuentaAdmin } from "@/lib/admin/consultas-cuentas";
import { formatearFechaAcreditacion } from "@/lib/horas-beca/formato-horas";
import { ESTADOS_CUENTA, ETIQUETAS_ESTADO_CUENTA } from "@/validators/cuentas-admin";

const TONOS = {
  ACTIVO: "acreditada",
  PENDIENTE: "pendiente",
  BLOQUEADO: "error",
} as const;

const ETIQUETAS_ROL: Record<string, string> = {
  ESTUDIANTE: "Estudiante",
  TUTOR: "Tutor",
  ADMINISTRADOR: "Administrador",
};

const CONFIRMAR_BLOQUEO =
  "La cuenta quedará bloqueada y esa persona no podrá iniciar sesión hasta que la reactives. ¿Continuar?";

/**
 * Cuentas registradas en la plataforma.
 *
 * El estado se cambia desde la fila porque es la única operación que AEUVG
 * hace sobre una cuenta: no se editan sus datos desde el panel, que son del
 * estudiante y se corrigen desde su perfil.
 */
export function TablaCuentas({
  cuentas,
  idAdministrador,
}: {
  cuentas: CuentaAdmin[];
  /** La cuenta de la sesión, que no puede bloquearse a sí misma. */
  idAdministrador: number;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(idUsuario: number, estado: string) {
    if (estado !== "ACTIVO" && !window.confirm(CONFIRMAR_BLOQUEO)) return;

    setTrabajando(idUsuario);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/estudiantes/${idUsuario}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo cambiar el estado de la cuenta.");
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
      <Tabla className="min-w-[56rem]">
        <TablaEncabezado>
          <tr>
            <TablaCeldaEncabezado>Carnet</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Estudiante</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Facultad</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Roles</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Último acceso</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          </tr>
        </TablaEncabezado>
        <TablaCuerpo>
          {cuentas.map((cuenta) => (
            <TablaFila key={cuenta.idUsuario}>
              <TablaCelda className="whitespace-nowrap">
                <span className="bg-superficie-suave text-texto rounded-lg px-2 py-1 font-mono text-sm font-bold">
                  {cuenta.carnet}
                </span>
              </TablaCelda>

              <TablaCelda>
                <span className="text-texto block font-semibold">{cuenta.nombreCompleto}</span>
                <span className="text-texto-suave block text-xs">{cuenta.correoUvg}</span>
                {/* Una cuenta sin verificar no ha confirmado su correo: es el
                    dato que explica por qué alguien no puede entrar. */}
                {!cuenta.correoVerificado && (
                  <span className="text-sobre-ambar block text-xs font-semibold">
                    Correo sin verificar
                  </span>
                )}
              </TablaCelda>

              <TablaCelda className="text-texto-suave max-w-[12rem] text-sm">
                {cuenta.facultad}
                <span className="block text-xs">{cuenta.carrera}</span>
              </TablaCelda>

              <TablaCelda className="text-texto-suave text-sm">
                {cuenta.roles.map((rol) => ETIQUETAS_ROL[rol] ?? rol).join(", ")}
              </TablaCelda>

              <TablaCelda className="text-texto-suave text-sm whitespace-nowrap">
                {cuenta.ultimoAcceso ? formatearFechaAcreditacion(cuenta.ultimoAcceso) : "Nunca"}
              </TablaCelda>

              <TablaCelda>
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaEstado tono={TONOS[cuenta.estado]}>
                    {ETIQUETAS_ESTADO_CUENTA[cuenta.estado]}
                  </EtiquetaEstado>

                  {cuenta.idUsuario === idAdministrador ? (
                    <span className="text-texto-suave text-xs">Tu cuenta</span>
                  ) : (
                    <select
                      aria-label={`Estado de la cuenta de ${cuenta.nombreCompleto}`}
                      value={cuenta.estado}
                      disabled={trabajando === cuenta.idUsuario}
                      onChange={(evento) => cambiarEstado(cuenta.idUsuario, evento.target.value)}
                      className="border-borde bg-superficie text-texto h-9 rounded-full border px-3 text-xs font-semibold"
                    >
                      {ESTADOS_CUENTA.map((estado) => (
                        <option key={estado} value={estado}>
                          {ETIQUETAS_ESTADO_CUENTA[estado]}
                        </option>
                      ))}
                    </select>
                  )}
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
