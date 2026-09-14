import Link from "next/link";
import { notFound } from "next/navigation";

import { ImagenEvento } from "@/components/eventos/imagen-evento";
import { MarcoSitio } from "@/components/layout/marco-sitio";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import { Tarjeta } from "@/components/ui/tarjeta";
import { obtenerEventoPublicado } from "@/lib/eventos/consultas-eventos";
import { estadoVisible, etiquetaEstado, tonoEstado } from "@/lib/eventos/estado-evento";
import { formatearRango } from "@/lib/eventos/formato-fechas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** El título de la pestaña es el nombre del evento, no el genérico de la sección. */
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const evento = await obtenerEventoPublicado(Number(id));

  if (!evento) return { title: "Evento no encontrado" };

  return { title: evento.nombre, description: evento.descripcion.slice(0, 160) };
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-texto-suave text-xs font-bold tracking-wide uppercase">{etiqueta}</dt>
      <dd className="text-texto mt-1 text-sm leading-relaxed">{valor}</dd>
    </div>
  );
}

export default async function PaginaEvento({ params }: Props) {
  const { id } = await params;
  const evento = await obtenerEventoPublicado(Number(id));

  // Un evento inexistente, en borrador o cancelado responde igual: no existe
  // para quien no administra la plataforma.
  if (!evento) notFound();

  const estado = estadoVisible(evento);

  return (
    <MarcoSitio>
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link href="/eventos" className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado de eventos
        </Link>

        <ImagenEvento
          imagenUrl={evento.imagenUrl}
          nombre={evento.nombre}
          color={evento.categoria.color}
          className="mt-5 h-56 w-full rounded-[1.25rem] sm:h-72"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: evento.categoria.color ?? "#6d4aff" }}
          >
            {evento.categoria.nombre}
          </span>
          {evento.destacado && <EtiquetaEstado tono="informativo">Destacado</EtiquetaEstado>}
          <EtiquetaEstado tono={tonoEstado(estado)}>{etiquetaEstado(estado)}</EtiquetaEstado>
        </div>

        <h1 className="text-texto mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {evento.nombre}
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <h2 className="text-texto text-xl font-bold">Acerca del evento</h2>
            <p className="text-texto-suave mt-3 leading-relaxed whitespace-pre-line">
              {evento.descripcion}
            </p>

            {evento.informacionAdicional && (
              <>
                <h2 className="text-texto mt-8 text-xl font-bold">Información adicional</h2>
                <p className="text-texto-suave mt-3 leading-relaxed whitespace-pre-line">
                  {evento.informacionAdicional}
                </p>
              </>
            )}
          </div>

          <Tarjeta className="h-fit">
            <dl className="flex flex-col gap-4">
              <Dato
                etiqueta="Fecha y hora"
                valor={formatearRango(evento.fechaInicio, evento.fechaFin)}
              />
              <Dato etiqueta="Ubicación" valor={evento.ubicacion} />
              {evento.cupo !== null && <Dato etiqueta="Cupo" valor={`${evento.cupo} personas`} />}
              {evento.organizadores.length > 0 && (
                <Dato etiqueta="Organiza" valor={evento.organizadores.join(", ")} />
              )}
            </dl>
          </Tarjeta>
        </div>
      </article>
    </MarcoSitio>
  );
}
