import { AccesosRapidos } from "@/components/inicio/accesos-rapidos";
import { SeccionPrincipal } from "@/components/inicio/seccion-principal";
import { MarcoSitio } from "@/components/layout/marco-sitio";

export default function PaginaInicio() {
  return (
    <MarcoSitio>
      <SeccionPrincipal />
      <AccesosRapidos />
    </MarcoSitio>
  );
}
