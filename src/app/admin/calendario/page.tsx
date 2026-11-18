import Link from "next/link";

import { AgendaCalendario } from "@/components/eventos/agenda-calendario";
import { ControlesCalendario } from "@/components/eventos/controles-calendario";
import { RejillaCalendario } from "@/components/eventos/rejilla-calendario";
import { Boton } from "@/components/ui/boton";
import {
  agruparEventosPorDia,
  construirCalendario,
  normalizarAncla,
  normalizarVista,
} from "@/lib/eventos/calendario";
import { listarEventosEnRangoAdmin } from "@/lib/eventos/consultas-eventos";
import { claveDiaLocal } from "@/lib/eventos/formato-fechas";

export const dynamic = "force-dynamic";

function valor(parametro: string | string[] | undefined): string | undefined {
  return Array.isArray(parametro) ? parametro[0] : parametro;
}

export default async function PaginaAdminCalendario({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const hoy = new Date();
  const vista = normalizarVista(valor(parametros.vista));
  const ancla = normalizarAncla(valor(parametros.fecha), hoy);
  const calendario = construirCalendario(vista, ancla, hoy);

  // Se consulta el rango completo de la grilla, incluidos los días de relleno
  // de los meses vecinos, para que esas casillas tampoco queden vacías.
  const eventos = await listarEventosEnRangoAdmin(calendario.desde, calendario.hasta);
  const eventosPorDia = agruparEventosPorDia(eventos, calendario.dias);

  const borradores = eventos.filter((evento) => evento.estado === "BORRADOR").length;
  const cancelados = eventos.filter((evento) => evento.estado === "CANCELADO").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight">Calendario</h1>
          <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
            Las actividades del periodo con su estado. A diferencia del calendario público, aquí
            aparecen también los borradores y los cancelados, que es lo que permite ver qué queda
            sin publicar antes de que llegue su fecha.
          </p>
        </div>

        <Link href="/admin/eventos/nuevo">
          <Boton>Nuevo evento</Boton>
        </Link>
      </div>

      <p className="text-texto-suave text-sm">
        {eventos.length} {eventos.length === 1 ? "evento" : "eventos"} en el periodo
        {borradores > 0 ? ` · ${borradores} sin publicar` : ""}
        {cancelados > 0 ? ` · ${cancelados} cancelados` : ""}
      </p>

      <div>
        <ControlesCalendario calendario={calendario} claveHoy={claveDiaLocal(hoy)} />

        <div className="md:hidden">
          <AgendaCalendario calendario={calendario} eventosPorDia={eventosPorDia} />
        </div>

        <div className="hidden md:block">
          <RejillaCalendario calendario={calendario} eventosPorDia={eventosPorDia} />
        </div>
      </div>
    </div>
  );
}
