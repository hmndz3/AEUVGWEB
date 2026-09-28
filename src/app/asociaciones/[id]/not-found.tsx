import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { MarcoSitio } from "@/components/layout/marco-sitio";

/**
 * Una asociación puede no existir o haber sido dada de baja. Los dos casos
 * llegan aquí con el mismo mensaje, para no revelar desde fuera del panel qué
 * registros existen sin estar activos.
 */
export default function AsociacionNoEncontrada() {
  return (
    <MarcoSitio>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EstadoVacioEventos
          titulo="No encontramos esta asociación"
          mensaje="El enlace puede haber cambiado o la asociación ya no está activa. Revisa el listado para ver las asociaciones del campus."
          accion={{ href: "/asociaciones", texto: "Ver todas las asociaciones" }}
        />
      </section>
    </MarcoSitio>
  );
}
