"use client";

import { useState } from "react";

import { FormularioComprobante } from "@/components/prestamo-batas/formulario-comprobante";
import { FormularioListaNegra } from "@/components/prestamo-batas/formulario-lista-negra";
import { FormularioPrestamo } from "@/components/prestamo-batas/formulario-prestamo";
import { TablaPrestamos } from "@/components/prestamo-batas/tabla-prestamos";
import { Alerta } from "@/components/ui/alerta";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import type {
  ArticuloSelector,
  JornadaVoluntario,
  MiComprobante,
  MiTurno,
  PrestamoPanel,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

type Pestana = "prestamos" | "lista-negra" | "jornada" | "horas";

const TONO_COMPROBANTE = {
  PENDIENTE: "pendiente",
  APROBADO: "acreditada",
  RECHAZADO: "error",
} as const;

/**
 * Espacio de trabajo del voluntario mientras atiende el salón: registrar
 * préstamos y sus devoluciones, anotar la lista negra y enviar el comprobante
 * con el que cierra su turno. Se organiza en pestañas porque son tareas
 * distintas sobre la misma pantalla.
 *
 * Enviar el comprobante cierra la jornada: los formularios de préstamo y de
 * lista negra desaparecen, porque ya no está atendiendo y lo que escriba
 * después no correspondería a su turno. Lo que queda es «Mi jornada», el
 * registro de lo que hizo ese día, para consultarlo sin poder cambiarlo.
 */
export function PanelVoluntario({
  articulos,
  prestamos,
  turnos,
  comprobantes,
  jornada,
}: {
  articulos: ArticuloSelector[];
  prestamos: PrestamoPanel[];
  turnos: MiTurno[];
  comprobantes: MiComprobante[];
  jornada: JornadaVoluntario;
}) {
  const pestanas: { clave: Pestana; texto: string }[] = [
    // Con el turno cerrado no se ofrecen los formularios: no hay por dónde
    // entrar a ellos, que es justo lo que se pidió.
    ...(jornada.cerrada
      ? []
      : ([
          { clave: "prestamos", texto: "Préstamos" },
          { clave: "lista-negra", texto: "Lista negra" },
        ] as const)),
    { clave: "jornada", texto: "Mi jornada" },
    { clave: "horas", texto: "Mis horas" },
  ];

  const [activa, setActiva] = useState<Pestana>(jornada.cerrada ? "jornada" : "prestamos");

  return (
    <div className="flex flex-col gap-6">
      {jornada.cerrada && (
        <Alerta tipo="informativo" titulo="Tu turno de hoy ya está cerrado">
          Enviaste tu comprobante, así que el salón deja de registrarse a tu nombre. Abajo queda lo
          que hiciste hoy; mañana podrás volver a registrar préstamos.
        </Alerta>
      )}

      <nav aria-label="Secciones del panel" className="border-borde flex gap-1 border-b">
        {pestanas.map((pestana) => {
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

      {activa === "jornada" && <Jornada jornada={jornada} />}

      {activa === "horas" && (
        <div className="flex flex-col gap-8">
          {jornada.cerrada ? (
            <Alerta tipo="informativo">
              Ya enviaste el comprobante de hoy. Lo encuentras abajo, con su estado.
            </Alerta>
          ) : (
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-texto text-lg font-bold">Cerrar mi turno</h2>
                <p className="text-texto-suave mt-1 text-sm leading-relaxed">
                  Reporta tu entrada y tu salida con la foto de cada una. AEUVG las revisa y te
                  acredita las horas beca por la duración del turno. Al enviarlo, el salón deja de
                  registrarse a tu nombre por hoy.
                </p>
              </div>
              <FormularioComprobante turnos={turnos} />
            </section>
          )}

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

/** Lo que el voluntario hizo el día que estuvo a cargo del salón. */
function Jornada({ jornada }: { jornada: JornadaVoluntario }) {
  const nada = jornada.prestamos.length === 0 && jornada.listaNegra.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-texto text-lg font-bold">Mi jornada del {jornada.fecha}</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Lo que registraste hoy mientras estuviste a cargo del salón.
        </p>
      </div>

      {jornada.comprobante && (
        <div className="border-borde bg-superficie flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          <div>
            <p className="text-texto text-sm font-semibold">{jornada.comprobante.turno}</p>
            <p className="text-texto-suave text-xs">
              Entraste a las {jornada.comprobante.horaEntrada} y saliste a las{" "}
              {jornada.comprobante.horaSalida} · {jornada.comprobante.horasTurno} h a acreditar
            </p>
            {jornada.comprobante.comentarioRevision && (
              <p className="text-texto-suave mt-1 text-xs italic">
                {jornada.comprobante.comentarioRevision}
              </p>
            )}
          </div>
          <EtiquetaEstado tono={TONO_COMPROBANTE[jornada.comprobante.estado]}>
            {jornada.comprobante.etiquetaEstado}
          </EtiquetaEstado>
        </div>
      )}

      {nada ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
          Todavía no registraste nada hoy.
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h3 className="text-texto text-base font-bold">
              Batas y lentes que presté ({jornada.prestamos.length})
            </h3>
            {jornada.prestamos.length === 0 ? (
              <p className="text-texto-suave text-sm">Hoy no prestaste nada.</p>
            ) : (
              <TablaPrestamos prestamos={jornada.prestamos} />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-texto text-base font-bold">
              Anotaciones en la lista negra ({jornada.listaNegra.length})
            </h3>
            {jornada.listaNegra.length === 0 ? (
              <p className="text-texto-suave text-sm">Hoy no anotaste a nadie.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {jornada.listaNegra.map((entrada) => (
                  <li
                    key={entrada.idListaNegra}
                    className="border-borde bg-superficie rounded-2xl border p-4"
                  >
                    <p className="text-texto text-sm font-semibold">
                      {entrada.nombre} {entrada.apellido ?? ""}
                      {entrada.carnet && (
                        <span className="text-texto-suave font-mono text-xs">
                          {" "}
                          · {entrada.carnet}
                        </span>
                      )}
                    </p>
                    <p className="text-texto-suave mt-1 text-sm leading-relaxed">
                      {entrada.justificacion}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
