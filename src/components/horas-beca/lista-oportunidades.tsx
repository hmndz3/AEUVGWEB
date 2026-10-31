import { Tarjeta, TarjetaTexto, TarjetaTitulo } from "@/components/ui/tarjeta";
import type { OportunidadPublica } from "@/lib/horas-beca/consultas-oportunidades-publicas";
import { formatearFechaActividad } from "@/lib/horas-beca/formato-horas";
import { formatearHorarioOportunidad } from "@/lib/horas-beca/horario-oportunidad";

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-0.5 text-sm font-semibold">{valor}</p>
    </div>
  );
}

/**
 * Convocatorias abiertas para realizar horas beca.
 *
 * Cada tarjeta trae lo que hace falta para decidir si presentarse: qué es, qué
 * día, a qué hora, dónde y cuánta gente se necesita. No hay inscripción todavía
 * —las horas las registra AEUVG después de la actividad—, así que la tarjeta no
 * promete un botón que no existe.
 */
export function ListaOportunidades({ oportunidades }: { oportunidades: OportunidadPublica[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {oportunidades.map((oportunidad) => (
        <Tarjeta key={oportunidad.idOportunidad} className="flex flex-col gap-4">
          <div>
            <TarjetaTitulo>{oportunidad.nombre}</TarjetaTitulo>
            <TarjetaTexto className="mt-2 leading-relaxed">{oportunidad.descripcion}</TarjetaTexto>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Dato titulo="Fecha" valor={formatearFechaActividad(oportunidad.fecha)} />
            <Dato
              titulo="Horario"
              valor={formatearHorarioOportunidad(oportunidad.horaInicio, oportunidad.horaFin)}
            />
            <Dato titulo="Lugar" valor={oportunidad.lugar} />
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
