import { formatearHoras } from "@/lib/horas-beca/formato-horas";
import type { HorasBecaEstudiante } from "@/lib/perfil/consultas-horas-beca";

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
      )}
    </section>
  );
}
