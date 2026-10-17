import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioHoraBeca } from "@/components/admin/formulario-hora-beca";
import { obtenerRegistroHoraBeca } from "@/lib/horas-beca/consultas-horas-beca";
import { diaParaFormulario, formatearFechaAcreditacion } from "@/lib/horas-beca/formato-horas";

export const dynamic = "force-dynamic";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const registro = await obtenerRegistroHoraBeca(id);

  if (!registro) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/horas-beca" className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          {registro.nombreCuenta ?? registro.nombreEstudiante}
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Carnet {registro.carnet}.{" "}
          {registro.estado === "ACREDITADA" && registro.fechaAcreditacion
            ? `Horas acreditadas el ${formatearFechaAcreditacion(registro.fechaAcreditacion)}. Corregir los datos no cambia su estado.`
            : "Horas pendientes de acreditación."}
        </p>
      </div>

      <FormularioHoraBeca
        id={id}
        valoresIniciales={{
          carnet: registro.carnet,
          // Se presenta el nombre con el que está guardado el registro: si la
          // cuenta existe, el servicio ya lo reemplazó por el de la cuenta.
          nombreEstudiante: registro.nombreEstudiante,
          fechaActividad: diaParaFormulario(registro.fechaActividad),
          horarioApoyo: registro.horarioApoyo,
          descripcionActividad: registro.descripcionActividad,
          cantidadHoras: String(registro.cantidadHoras),
          observaciones: registro.observaciones ?? "",
        }}
      />
    </div>
  );
}
