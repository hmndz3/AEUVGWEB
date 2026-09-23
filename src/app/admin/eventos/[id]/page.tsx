import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioEvento, type ValoresEvento } from "@/components/admin/formulario-evento";
import { listarCategorias, listarOrganizadores } from "@/lib/eventos/consultas-eventos";
import { crearServicioEventos } from "@/lib/eventos/crear-servicio-eventos";
import { paraCampoFechaHora } from "@/lib/eventos/formato-fechas";
import type { EventoAdministrado } from "@/lib/eventos/repositorio-eventos";

export const dynamic = "force-dynamic";

function aValores(evento: EventoAdministrado): ValoresEvento {
  const asociacion = evento.organizadores.find((organizador) => organizador.idAsociacion);
  const club = evento.organizadores.find((organizador) => organizador.idClub);
  const unidad = evento.organizadores.find((organizador) => organizador.unidadUvg);

  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    idCategoriaEvento: String(evento.idCategoriaEvento),
    tipoActividad: evento.tipoActividad,
    fechaInicio: paraCampoFechaHora(evento.fechaInicio),
    fechaFin: paraCampoFechaHora(evento.fechaFin),
    ubicacion: evento.ubicacion,
    cupo: evento.cupo === null ? "" : String(evento.cupo),
    informacionAdicional: evento.informacionAdicional ?? "",
    imagenUrl: evento.imagenUrl ?? "",
    destacado: evento.destacado,
    idAsociacion: asociacion?.idAsociacion ? String(asociacion.idAsociacion) : "",
    idClub: club?.idClub ? String(club.idClub) : "",
    unidadUvg: unidad?.unidadUvg ?? "",
  };
}

export default async function PaginaEditarEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idEvento = Number(id);

  if (!Number.isSafeInteger(idEvento) || idEvento <= 0) notFound();

  const [evento, categorias, organizadores] = await Promise.all([
    crearServicioEventos().obtener(idEvento),
    listarCategorias(),
    listarOrganizadores(),
  ]);

  if (!evento) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/eventos" className="text-primario text-sm font-bold hover:underline">
          ← Volver a eventos
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight break-words">
          {evento.nombre}
        </h1>
        <p className="text-texto-suave mt-2 text-sm">
          Editar el evento no cambia su estado de publicación.
        </p>
      </div>

      <FormularioEvento
        idEvento={idEvento}
        valoresIniciales={aValores(evento)}
        categorias={categorias}
        organizadores={organizadores}
      />
    </div>
  );
}
