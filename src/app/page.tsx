import { AccesosRapidos } from "@/components/inicio/accesos-rapidos";
import {
  ActividadesDestacadas,
  ProximosEventos,
  RedesSociales,
} from "@/components/inicio/secciones-eventos";
import { SeccionPrincipal } from "@/components/inicio/seccion-principal";
import { MarcoSitio } from "@/components/layout/marco-sitio";

// Las secciones consultan eventos y redes en la base, por lo que la portada
// se resuelve en cada petición y no en el build.
export const dynamic = "force-dynamic";

export default function PaginaInicio() {
  return (
    <MarcoSitio>
      <SeccionPrincipal />
      <AccesosRapidos />
      <ActividadesDestacadas />
      <ProximosEventos />
      <RedesSociales />
    </MarcoSitio>
  );
}
