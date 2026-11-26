"use client";

import { useState } from "react";

import { FormularioComprobante } from "@/components/prestamo-batas/formulario-comprobante";
import { FormularioListaNegra } from "@/components/prestamo-batas/formulario-lista-negra";
import { FormularioPrestamo } from "@/components/prestamo-batas/formulario-prestamo";
import { TablaPrestamos } from "@/components/prestamo-batas/tabla-prestamos";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type {
  ArticuloSelector,
  MiComprobante,
  MiTurno,
  PrestamoPanel,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

type Pestana = "prestamos" | "lista-negra" | "horas";

const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: "prestamos", texto: "Préstamos" },
  { clave: "lista-negra", texto: "Lista negra" },
  { clave: "horas", texto: "Mis horas" },
];

const TONO_COMPROBANTE = {
  PENDIENTE: "pendiente",
  APROBADO: "acreditada",
  RECHAZADO: "error",
} as const;

/**
 * Espacio de trabajo del voluntario mientras atiende el salón: registrar
 * préstamos y sus devoluciones, anotar la lista negra y enviar sus comprobantes
 * de horas. Se organiza en pestañas porque son tres tareas distintas sobre la
 * misma pantalla.
 */
export function PanelVoluntario({
  articulos,
  prestamos,
  turnos,
  comprobantes,
}: {
  articulos: ArticuloSelector[];
  prestamos: PrestamoPanel[];
  turnos: MiTurno[];
  comprobantes: MiComprobante[];
}) {
  const [activa, setActiva] = useState<Pestana>("prestamos");

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Secciones del panel" className="border-borde flex gap-1 border-b">
        {PESTANAS.map((pestana) => {
          const actual = pestana.clave === activa;
          return (
            <button
              key={pestana.clave}
              type="button"
              onClick={() => setActiva(pestana.clave)}
              aria-current={actual ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                actual
                  ? "border-primario text-primario"
                  : "text-texto-suave hover:text-texto border-transparent"
              }`}
            >
              {pestana.texto}
            </button>
          );
        })}
      </nav>

      {activa === "prestamos" && (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-texto text-lg font-bold">Registrar un préstamo</h2>
            <FormularioPrestamo articulos={articulos} />
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-texto text-lg font-bold">Préstamos recientes</h2>
            <TablaPrestamos prestamos={prestamos} permitirDevolver />
          </section>
        </div>
      )}

      {activa === "lista-negra" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-texto text-lg font-bold">Agregar a la lista negra</h2>
            <p className="text-texto-suave mt-1 text-sm leading-relaxed">
              Registra a quien no devolvió una bata o la devolvió con un problema.
            </p>
          </div>
          <FormularioListaNegra />
        </section>
      )}

      {activa === "horas" && (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-texto text-lg font-bold">Enviar comprobante de horas</h2>
              <p className="text-texto-suave mt-1 text-sm leading-relaxed">
                Reporta tu entrada y salida de un turno. AEUVG lo revisa y te acredita las horas
                beca por la duración del turno.
              </p>
            </div>
            <FormularioComprobante turnos={turnos} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-texto text-lg font-bold">Mis comprobantes</h2>
            {comprobantes.length === 0 ? (
              <p className="text-texto-suave text-sm">Todavía no has enviado ningún comprobante.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {comprobantes.map((comprobante) => (
                  <li
                    key={comprobante.idComprobante}
                    className="border-borde bg-superficie flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-4"
                  >
                    <div>
                      <p className="text-texto text-sm font-semibold">{comprobante.turno}</p>
                      <p className="text-texto-suave text-xs">
                        {comprobante.fecha} · {comprobante.horaEntrada}–{comprobante.horaSalida} ·{" "}
                        {comprobante.horasTurno} h
                      </p>
                      {comprobante.comentarioRevision && (
                        <p className="text-texto-suave mt-1 text-xs italic">
                          {comprobante.comentarioRevision}
                        </p>
                      )}
                    </div>
                    <EtiquetaEstado tono={TONO_COMPROBANTE[comprobante.estado]}>
                      {comprobante.etiquetaEstado}
                    </EtiquetaEstado>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
