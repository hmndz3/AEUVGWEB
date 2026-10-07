import { ListadoOrganizaciones } from "@/components/admin/listado-organizaciones";
import { listarOrganizacionesAdministracion } from "@/lib/organizaciones/consultas-organizaciones";

export const dynamic = "force-dynamic";

function valor(parametro: string | string[] | undefined): string {
  return ((Array.isArray(parametro) ? parametro[0] : parametro) ?? "").trim();
}

export default async function PaginaAdminClubes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const busqueda = valor(parametros.q);
  const pagina = await listarOrganizacionesAdministracion("clubes", {
    pagina: Number(valor(parametros.pagina)) || 1,
    busqueda,
  });

  return (
    <ListadoOrganizaciones
      tipo="clubes"
      titulo="Clubes"
      descripcion="Clubes estudiantiles, sus actividades y sus medios de contacto. Dar de baja un club lo retira del sitio sin borrar los eventos que organizó."
      textoCrear="Crear club"
      pagina={pagina}
      busqueda={busqueda}
    />
  );
}
