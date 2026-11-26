import { EditorTurnos } from "@/components/admin/prestamo-batas/editor-turnos";
import { PestanasPrestamoBatas } from "@/components/admin/prestamo-batas/pestanas-prestamo-batas";
import {
  contarPendientesPanel,
  listarTurnosPanel,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export default async function PaginaAdminTurnos() {
  const [turnos, pendientes] = await Promise.all([listarTurnosPanel(), contarPendientesPanel()]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Turnos de atención</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Días y horarios en los que el salón está abierto. Cada turno admite a dos voluntarios;
          cuando se llena deja de aceptar postulaciones.
        </p>
      </div>

      <PestanasPrestamoBatas
        activa="turnos"
        postulaciones={pendientes.postulaciones}
        comprobantes={pendientes.comprobantes}
      />

      <EditorTurnos turnos={turnos} />
    </div>
  );
}
