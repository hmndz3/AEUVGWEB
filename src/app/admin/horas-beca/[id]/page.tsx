import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioHoraBeca } from "@/components/admin/formulario-hora-beca";
import { listarEventosDeActividad } from "@/lib/horas-beca/actividad-evento";
import { obtenerRegistroHoraBeca } from "@/lib/horas-beca/consultas-horas-beca";
import {
  ACTIVIDAD_OTRA,
  destinoPanelHoras,
  diaParaFormulario,
  formatearFechaAcreditacion,
  nombreVisibleDelRegistro,
  partesDelHorario,
} from "@/lib/horas-beca/formato-horas";

export const dynamic = "force-dynamic";

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const [registro, parametros, eventos] = await Promise.all([
    obtenerRegistroHoraBeca(id),
    searchParams,
    listarEventosDeActividad(),
  ]);

  if (!registro) notFound();

  // El listado del que se viene, con sus filtros, para volver a él al guardar.
  const destino = destinoPanelHoras(parametros.volver);
  // Un registro anterior al selector podía llevar texto libre: en ese caso los
  // selectores quedan vacíos y hay que volver a elegir el horario.
  const horario = partesDelHorario(registro.horarioApoyo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={destino} className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          {nombreVisibleDelRegistro(registro)}
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Carnet {registro.carnet}.{" "}
          {registro.nombreCuenta === null
            ? "Este carnet todavía no tiene cuenta en la plataforma: el registro se vinculará solo cuando la cree. "
            : ""}
          {registro.estado === "ACREDITADA" && registro.fechaAcreditacion
            ? `Horas acreditadas el ${formatearFechaAcreditacion(registro.fechaAcreditacion)}. Corregir los datos no cambia su estado.`
            : "Horas pendientes de acreditación."}
        </p>
      </div>

      <FormularioHoraBeca
        id={id}
        destino={destino}
        eventos={eventos}
        valoresIniciales={{
          carnet: registro.carnet,
          // Se presenta el nombre con el que está guardado el registro: si la
          // cuenta existe, el servicio ya lo reemplazó por el de la cuenta.
          nombreEstudiante: registro.nombreEstudiante,
          fechaActividad: diaParaFormulario(registro.fechaActividad),
          horaInicio: horario?.inicio ?? "",
          horaFin: horario?.fin ?? "",
          // Los registros sin evento (anteriores, importados o de otra
          // actividad) se abren con su descripción escrita a mano.
          idEvento: registro.idEvento ? String(registro.idEvento) : ACTIVIDAD_OTRA,
          descripcionActividad: registro.descripcionActividad,
          cantidadHoras: String(registro.cantidadHoras),
          observaciones: registro.observaciones ?? "",
        }}
      />
    </div>
  );
}
