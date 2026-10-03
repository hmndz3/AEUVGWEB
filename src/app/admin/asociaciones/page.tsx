import { ListadoOrganizaciones } from "@/components/admin/listado-organizaciones";
import { listarOrganizacionesAdministracion } from "@/lib/organizaciones/consultas-organizaciones";

export const dynamic = "force-dynamic";

function valor(parametro: string | string[] | undefined): string {
  return ((Array.isArray(parametro) ? parametro[0] : parametro) ?? "").trim();
}

export default async function PaginaAdminAsociaciones({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const busqueda = valor(parametros.q);
  const pagina = await listarOrganizacionesAdministracion("asociaciones", {
    pagina: Number(valor(parametros.pagina)) || 1,
    busqueda,
  });

  return (
    <ListadoOrganizaciones
      tipo="asociaciones"
      titulo="Asociaciones"
      descripcion="Información, junta directiva e integrantes de cada asociación. Dar de baja una asociación la retira del sitio sin borrar los eventos que organizó."
      textoCrear="Crear asociación"
      pagina={pagina}
      busqueda={busqueda}
    />
  );
}
