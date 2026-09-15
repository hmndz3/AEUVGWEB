import { EstadoVacioEventos } from "@/components/eventos/estado-vacio-eventos";
import { MarcoSitio } from "@/components/layout/marco-sitio";

/**
 * Un evento puede no existir, seguir en borrador o haber sido cancelado. Los
 * tres casos llegan aquí con el mismo mensaje, para no revelar desde fuera del
 * panel qué eventos existen sin estar publicados.
 */
export default function EventoNoEncontrado() {
  return (
    <MarcoSitio>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EstadoVacioEventos
          titulo="No encontramos este evento"
          mensaje="El enlace puede haber cambiado o la actividad ya no está publicada. Revisa la cartelera para ver los eventos disponibles."
          accion={{ href: "/eventos", texto: "Ver todos los eventos" }}
        />
      </section>
    </MarcoSitio>
  );
}
