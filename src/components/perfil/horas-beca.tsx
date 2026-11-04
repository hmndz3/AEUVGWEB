import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import {
  formatearFechaAcreditacion,
  formatearFechaActividad,
  formatearHoras,
} from "@/lib/horas-beca/formato-horas";
import type { HorasBecaEstudiante } from "@/lib/perfil/consultas-horas-beca";
import { ETIQUETAS_ESTADO_HORA_BECA } from "@/validators/horas-beca";

function Total({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
      <p className="text-texto-suave mt-1 text-xs leading-relaxed">{detalle}</p>
    </div>
  );
}

/**
 * Horas beca dentro del perfil del estudiante.
 *
 * Responde la pregunta por la que el estudiantado escribía a AEUVG: cuántas
 * horas lleva y cuántas le faltan por acreditar. Las horas las registra y
 * acredita AEUVG a partir del apoyo prestado, así que esta sección es de solo
 * lectura: no hay nada que el estudiante pueda cambiar desde aquí.
 */
export function HorasBecaPerfil({ horas }: { horas: HorasBecaEstudiante }) {
  const { totales } = horas;

  return (
    <section id="mis-horas-beca" className="flex flex-col gap-6">
      <div>
        <h2 className="text-texto text-lg font-bold">Mis horas beca</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Las horas de servicio que AEUVG tiene registradas a tu carnet. Las acredita AEUVG después
          de cada actividad.
        </p>
      </div>

      {totales.actividades === 0 ? (
        <div className="border-borde bg-superficie-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center">
          <p className="text-texto text-sm font-bold">Todavía no tienes horas beca registradas</p>
          <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
            AEUVG registra las horas a tu carnet después de cada actividad en la que apoyes. Cuando
            lo haga, aparecerán aquí con su estado, aunque se hayan realizado antes de que crearas
            tu cuenta.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Total
              titulo="Horas realizadas"
              valor={formatearHoras(totales.realizadas)}
              detalle={`${totales.actividades} ${totales.actividades === 1 ? "actividad registrada" : "actividades registradas"}`}
            />
            <Total
              titulo="Horas acreditadas"
              valor={formatearHoras(totales.acreditadas)}
              detalle="Ya reconocidas por AEUVG"
            />
            <Total
              titulo="Horas pendientes"
              valor={formatearHoras(totales.pendientes)}
              detalle="A la espera de acreditación"
            />
          </div>

          <div>
            <h3 className="text-texto-suave text-xs font-bold tracking-wide uppercase">
              Historial de actividades
            </h3>

            {/* El historial va de lo más reciente a lo más antiguo: lo que el
                estudiante viene a comprobar es si ya le acreditaron lo último
                que hizo. */}
            <div className="mt-4">
              <Tabla className="min-w-[36rem]">
                <TablaEncabezado>
                  <tr>
                    <TablaCeldaEncabezado>Fecha</TablaCeldaEncabezado>
                    <TablaCeldaEncabezado>Horario</TablaCeldaEncabezado>
                    <TablaCeldaEncabezado>Actividad</TablaCeldaEncabezado>
                    <TablaCeldaEncabezado className="text-right">Horas</TablaCeldaEncabezado>
                    <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
                  </tr>
                </TablaEncabezado>
                <TablaCuerpo>
                  {horas.actividades.map((actividad) => (
                    <TablaFila key={actividad.idRegistroHora}>
                      <TablaCelda className="text-texto-suave whitespace-nowrap">
                        {formatearFechaActividad(actividad.fechaActividad)}
                      </TablaCelda>
                      <TablaCelda className="text-texto-suave whitespace-nowrap">
                        {actividad.horarioApoyo}
                      </TablaCelda>
                      <TablaCelda className="text-texto">
                        {actividad.descripcionActividad}
                      </TablaCelda>
                      <TablaCelda className="text-texto text-right font-semibold whitespace-nowrap">
                        {formatearHoras(actividad.cantidadHoras)}
                      </TablaCelda>
                      <TablaCelda>
                        <EtiquetaEstado
                          tono={actividad.estado === "ACREDITADA" ? "acreditada" : "pendiente"}
                        >
                          {ETIQUETAS_ESTADO_HORA_BECA[actividad.estado]}
                        </EtiquetaEstado>
                        {/* AEUVG lo pidió en la revisión: saber que una
                            actividad está acreditada no basta, el estudiante
                            necesita desde cuándo para reclamar lo que falta. */}
                        {actividad.fechaAcreditacion && (
                          <span className="text-texto-suave mt-1 block text-xs">
                            desde el {formatearFechaAcreditacion(actividad.fechaAcreditacion)}
                          </span>
                        )}
                      </TablaCelda>
                    </TablaFila>
                  ))}
                </TablaCuerpo>
              </Tabla>
            </div>

            <p className="text-texto-suave mt-3 text-xs leading-relaxed">
              Si falta una actividad o un dato no corresponde, escribe a AEUVG: el registro lo
              administra la asociación.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
