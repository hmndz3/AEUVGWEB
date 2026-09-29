import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { BloqueTexto } from "@/components/organizaciones/bloque-texto";
import { ContactoOrganizacion } from "@/components/organizaciones/contacto-organizacion";
import { EncabezadoOrganizacion } from "@/components/organizaciones/encabezado-organizacion";
import { JuntaDirectiva } from "@/components/organizaciones/junta-directiva";
import {
  esAsociacionGeneral,
  obtenerAsociacion,
} from "@/lib/organizaciones/consultas-organizaciones";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * La página se consulta dos veces por petición, una para los metadatos y otra
 * para el contenido. La memoria de React comparte el resultado entre ambas, de
 * modo que la base reciba una sola consulta.
 */
const consultar = cache(async (id: string) => obtenerAsociacion(Number(id)));

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const asociacion = await consultar(id);

  if (!asociacion) return { title: "Asociación no encontrada" };

  return {
    title: asociacion.nombre,
    description: (asociacion.descripcion ?? asociacion.mision ?? asociacion.nombre).slice(0, 160),
  };
}

export default async function PaginaAsociacion({ params }: Props) {
  const { id } = await params;

  // La asociación general tiene su propia página institucional: entrar por el
  // listado de asociaciones lleva allí en lugar de duplicar su contenido.
  if (await esAsociacionGeneral(Number(id))) redirect("/sobre-aeuvg");

  const asociacion = await consultar(id);

  // Una asociación inexistente y una dada de baja responden igual: no existe
  // para quien no administra la plataforma.
  if (!asociacion) notFound();

  return (
    <MarcoSitio>
      <article className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        <EncabezadoOrganizacion
          nombre={asociacion.nombre}
          descripcion={asociacion.descripcion}
          imagenUrl={asociacion.imagenUrl}
          etiqueta="Asociación estudiantil"
          volver={{ href: "/asociaciones", texto: "Volver a las asociaciones" }}
        />

        {(asociacion.mision || asociacion.vision) && (
          <div className="grid gap-5 md:grid-cols-2">
            <BloqueTexto titulo="Misión" texto={asociacion.mision} className="bg-turquesa/12" />
            <BloqueTexto titulo="Visión" texto={asociacion.vision} className="bg-coral/12" />
          </div>
        )}

        <JuntaDirectiva
          integrantes={asociacion.integrantes}
          columnas={3}
          descripcion="Las personas electas por el estudiantado para representarlo y coordinar el trabajo de la asociación durante el periodo vigente."
        />

        <ContactoOrganizacion
          correo={asociacion.correo}
          informacionContacto={asociacion.informacionContacto}
          redesSociales={asociacion.redesSociales}
        />
      </article>
    </MarcoSitio>
  );
}
