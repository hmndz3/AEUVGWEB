import { EditorInventario } from "@/components/admin/prestamo-batas/editor-inventario";
import { PestanasPrestamoBatas } from "@/components/admin/prestamo-batas/pestanas-prestamo-batas";
import {
  contarPendientesPanel,
  listarInventarioPanel,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export default async function PaginaAdminInventario() {
  const [articulos, pendientes] = await Promise.all([
    listarInventarioPanel(),
    contarPendientesPanel(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Préstamo de batas</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Inventario de batas y lentes que se prestan en el salón. Las cantidades disponibles se
          descuentan de los préstamos sin devolver.
        </p>
      </div>

      <PestanasPrestamoBatas
        activa="inventario"
        postulaciones={pendientes.postulaciones}
        comprobantes={pendientes.comprobantes}
      />

      <EditorInventario articulos={articulos} />
    </div>
  );
}
