import { TarjetaOrganizacion } from "@/components/organizaciones/tarjeta-organizacion";
import type { OrganizacionResumen } from "@/lib/organizaciones/consultas-organizaciones";

/** Rejilla de organizaciones: tres columnas en escritorio, una en teléfono. */
export function ListaOrganizaciones({
  organizaciones,
  ruta,
}: {
  organizaciones: OrganizacionResumen[];
  ruta: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {organizaciones.map((organizacion) => (
        <TarjetaOrganizacion key={organizacion.id} organizacion={organizacion} ruta={ruta} />
      ))}
    </div>
  );
}
