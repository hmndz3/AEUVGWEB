import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { MarcoSitio } from "@/components/layout/marco-sitio";

/**
 * Un club puede no existir o haber sido dado de baja. Los dos casos llegan aquí
 * con el mismo mensaje, para no revelar desde fuera del panel qué registros
 * existen sin estar activos.
 */
export default function ClubNoEncontrado() {
  return (
    <MarcoSitio>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EstadoVacioEventos
          titulo="No encontramos este club"
          mensaje="El enlace puede haber cambiado o el club ya no está activo. Revisa el listado para ver los clubes del campus."
          accion={{ href: "/clubes", texto: "Ver todos los clubes" }}
        />
      </section>
    </MarcoSitio>
  );
}
