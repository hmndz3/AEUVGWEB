import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioOportunidad } from "@/components/admin/formulario-oportunidad";
import { Alerta } from "@/components/ui/alerta";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { obtenerOportunidadPanel } from "@/lib/horas-beca/consultas-oportunidades";
import { diaParaFormulario } from "@/lib/horas-beca/formato-horas";
import {
  DESCRIPCIONES_ESTADO_OPORTUNIDAD,
  ETIQUETAS_ESTADO_OPORTUNIDAD,
} from "@/validators/oportunidad-admin";

export const dynamic = "force-dynamic";

const RUTA = "/admin/horas-beca/oportunidades";

/** Estados en los que la convocatoria ya no se edita: su información es histórico. */
const FINALES = ["CANCELADA", "FINALIZADA"] as const;

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const oportunidad = await obtenerOportunidadPanel(Number((await params).id));
  if (!oportunidad) notFound();

  const cerrada = FINALES.some((estado) => estado === oportunidad.estado);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={RUTA} className="text-primario text-sm font-bold hover:underline">
          ← Volver a las convocatorias
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">
            {oportunidad.nombre}
          </h1>
          <EtiquetaEstado tono={oportunidad.estado === "PUBLICADA" ? "acreditada" : "neutro"}>
            {ETIQUETAS_ESTADO_OPORTUNIDAD[oportunidad.estado]}
          </EtiquetaEstado>
        </div>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          {DESCRIPCIONES_ESTADO_OPORTUNIDAD[oportunidad.estado]} El estado se cambia desde el
          listado, con su propia acción.
        </p>
      </div>

      {cerrada ? (
        <Alerta tipo="informativo" titulo="Esta convocatoria ya no se edita">
          Su información es la que vio quien se presentó, así que se conserva tal como quedó.
        </Alerta>
      ) : (
        <FormularioOportunidad
          id={oportunidad.idOportunidad}
          valoresIniciales={{
            nombre: oportunidad.nombre,
            descripcion: oportunidad.descripcion,
            fecha: diaParaFormulario(oportunidad.fecha),
            horaInicio: oportunidad.horaInicio,
            horaFin: oportunidad.horaFin,
            lugar: oportunidad.lugar,
            cantidadPersonas: String(oportunidad.cantidadPersonas),
            informacionAdicional: oportunidad.informacionAdicional ?? "",
          }}
          destino={RUTA}
        />
      )}
    </div>
  );
}
