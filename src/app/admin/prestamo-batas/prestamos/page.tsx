import { PestanasPrestamoBatas } from "@/components/admin/prestamo-batas/pestanas-prestamo-batas";
import { TablaListaNegra } from "@/components/admin/prestamo-batas/tabla-lista-negra";
import { TablaPrestamos } from "@/components/prestamo-batas/tabla-prestamos";
import {
  contarPendientesPanel,
  listarListaNegra,
  listarPrestamos,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export default async function PaginaAdminPrestamos() {
  const [prestamos, listaNegra, pendientes] = await Promise.all([
    listarPrestamos(150),
    listarListaNegra(150),
    contarPendientesPanel(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">
          Préstamos y lista negra
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Historial de préstamos registrados por los voluntarios y la lista negra de quienes no
          devolvieron una bata. La devolución la registra el voluntario desde su panel.
        </p>
      </div>

      <PestanasPrestamoBatas
        activa="prestamos"
        postulaciones={pendientes.postulaciones}
        comprobantes={pendientes.comprobantes}
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Préstamos</h2>
        <TablaPrestamos prestamos={prestamos} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Lista negra</h2>
        <TablaListaNegra entradas={listaNegra} />
      </section>
    </div>
  );
}
