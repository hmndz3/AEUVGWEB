"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Boton } from "@/components/ui/boton";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCeldaEncabezado,
  TablaCelda,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { PrestamoPanel } from "@/lib/prestamo-batas/consultas-prestamo-batas";

/**
 * Tabla de préstamos. Para el voluntario trae el botón de devolución, que
 * regresa el artículo al inventario; en el panel admin es solo de consulta.
 */
export function TablaPrestamos({
  prestamos,
  permitirDevolver = false,
}: {
  prestamos: PrestamoPanel[];
  permitirDevolver?: boolean;
}) {
  const router = useRouter();
  const [devolviendo, setDevolviendo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function devolver(idPrestamo: number) {
    setDevolviendo(idPrestamo);
    setError(null);

    try {
      const respuesta = await fetch(`/api/prestamo-batas/prestamos/${idPrestamo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (respuesta.ok) {
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
      setError(cuerpo.mensaje ?? "No se pudo registrar la devolución.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setDevolviendo(null);
    }
  }

  if (prestamos.length === 0) {
    return (
      <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
        No hay préstamos registrados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-error text-sm font-medium">{error}</p>}

      <Tabla>
        <TablaEncabezado>
          <tr>
            <TablaCeldaEncabezado>Persona</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Artículos</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Salida</TablaCeldaEncabezado>
            <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
            {permitirDevolver && (
              <TablaCeldaEncabezado className="text-right">Acción</TablaCeldaEncabezado>
            )}
          </tr>
        </TablaEncabezado>
        <TablaCuerpo>
          {prestamos.map((prestamo) => (
            <TablaFila key={prestamo.idPrestamo}>
              <TablaCelda>
                <p className="text-texto font-semibold">{prestamo.persona}</p>
                <p className="text-texto-suave text-xs">
                  {prestamo.carnet} · {prestamo.fecha}
                </p>
              </TablaCelda>
              <TablaCelda>
                <ul className="text-texto-suave flex flex-col gap-0.5 text-xs">
                  {prestamo.articulos.map((articulo, indice) => (
                    <li key={indice}>{articulo}</li>
                  ))}
                </ul>
              </TablaCelda>
              <TablaCelda className="text-texto-suave text-xs whitespace-nowrap">
                {prestamo.horaSalida}
                {prestamo.horaEntregaEstimada && (
                  <span className="block">→ {prestamo.horaEntregaEstimada}</span>
                )}
              </TablaCelda>
              <TablaCelda>
                <EtiquetaEstado tono={prestamo.estado === "PRESTADO" ? "pendiente" : "acreditada"}>
                  {prestamo.etiquetaEstado}
                </EtiquetaEstado>
              </TablaCelda>
              {permitirDevolver && (
                <TablaCelda className="text-right">
                  {prestamo.estado === "PRESTADO" ? (
                    <Boton
                      type="button"
                      variante="contorno"
                      tamano="sm"
                      cargando={devolviendo === prestamo.idPrestamo}
                      onClick={() => devolver(prestamo.idPrestamo)}
                    >
                      Devolver
                    </Boton>
                  ) : (
                    <span className="text-texto-suave text-xs">—</span>
                  )}
                </TablaCelda>
              )}
            </TablaFila>
          ))}
        </TablaCuerpo>
      </Tabla>
    </div>
  );
}
