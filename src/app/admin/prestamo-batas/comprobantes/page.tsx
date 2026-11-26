import { ListaComprobantes } from "@/components/admin/prestamo-batas/lista-comprobantes";
import { PestanasPrestamoBatas } from "@/components/admin/prestamo-batas/pestanas-prestamo-batas";
import {
  contarPendientesPanel,
  listarComprobantesPendientes,
  listarComprobantesRevisados,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export default async function PaginaAdminComprobantes() {
  const [pendientesLista, revisados, pendientes] = await Promise.all([
    listarComprobantesPendientes(),
    listarComprobantesRevisados(),
    contarPendientesPanel(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Comprobantes de horas</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Comprobantes de entrada y salida de los voluntarios. Al aprobar uno se crea un registro de
          horas beca pendiente de acreditar, por la duración del turno.
        </p>
      </div>

      <PestanasPrestamoBatas
        activa="comprobantes"
        postulaciones={pendientes.postulaciones}
        comprobantes={pendientes.comprobantes}
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Por revisar</h2>
        <ListaComprobantes
          comprobantes={pendientesLista}
          revisable
          vacio="No hay comprobantes por revisar."
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Revisados</h2>
        <ListaComprobantes comprobantes={revisados} vacio="Todavía no has revisado comprobantes." />
      </section>
    </div>
  );
}
