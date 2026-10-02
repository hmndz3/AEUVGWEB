import { notFound } from "next/navigation";
import { cache } from "react";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { ActividadesOrganizador } from "@/components/organizaciones/actividades-organizador";
import { BloqueTexto } from "@/components/organizaciones/bloque-texto";
import { ContactoOrganizacion } from "@/components/organizaciones/contacto-organizacion";
import { EncabezadoOrganizacion } from "@/components/organizaciones/encabezado-organizacion";
import { obtenerClub } from "@/lib/organizaciones/consultas-organizaciones";
import { obtenerActividadesDeOrganizador } from "@/lib/organizaciones/eventos-organizador";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const consultar = cache(async (id: string) => obtenerClub(Number(id)));

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const club = await consultar(id);

  if (!club) return { title: "Club no encontrado" };

  return {
    title: club.nombre,
    description: (club.descripcion ?? club.actividades ?? club.nombre).slice(0, 160),
  };
}

export default async function PaginaClub({ params }: Props) {
  const { id } = await params;
  const club = await consultar(id);

  // Un club inexistente y uno dado de baja responden igual: no existe para quien
  // no administra la plataforma.
  if (!club) notFound();

  const ahora = new Date();
  const actividades = await obtenerActividadesDeOrganizador(
    { tipo: "club", id: club.id },
    { ahora }
  );

  return (
    <MarcoSitio>
      <article className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        <EncabezadoOrganizacion
          nombre={club.nombre}
          descripcion={club.descripcion}
          imagenUrl={club.imagenUrl}
          etiqueta="Club estudiantil"
          volver={{ href: "/clubes", texto: "Volver a los clubes" }}
        />

        {/* Un club no tiene junta directiva registrada: en su lugar ocupa este
            espacio lo que hace habitualmente, que es lo que alguien necesita
            saber antes de integrarse. */}
        <BloqueTexto titulo="Qué hacemos" texto={club.actividades} className="bg-turquesa/12" />

        <ActividadesOrganizador
          actividades={actividades}
          nombre={club.nombre}
          filtro={`club=${club.id}`}
          ahora={ahora}
        />

        <ContactoOrganizacion
          correo={club.correo}
          informacionContacto={club.informacionContacto}
          redesSociales={club.redesSociales}
        />
      </article>
    </MarcoSitio>
  );
}
