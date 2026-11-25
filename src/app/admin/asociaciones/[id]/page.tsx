import { notFound, redirect } from "next/navigation";

import { PantallaEdicionOrganizacion } from "@/components/admin/pantalla-organizacion";
import { esAsociacionGeneral } from "@/lib/organizaciones/consultas-organizaciones";

export const dynamic = "force-dynamic";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // La ficha de AEUVG tiene su propia sección, que no permite cambiarle el
  // nombre con el que la página institucional la encuentra.
  if (await esAsociacionGeneral(id)) redirect("/admin/sobre-aeuvg");

  return <PantallaEdicionOrganizacion tipo="asociaciones" id={id} />;
}
