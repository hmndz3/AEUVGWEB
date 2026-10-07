import { notFound } from "next/navigation";

import { PantallaEdicionOrganizacion } from "@/components/admin/pantalla-organizacion";

export const dynamic = "force-dynamic";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <PantallaEdicionOrganizacion tipo="asociaciones" id={id} />;
}
