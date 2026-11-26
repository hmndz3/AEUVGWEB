import { ListaPostulacionesVoluntario } from "@/components/admin/prestamo-batas/lista-postulaciones-voluntario";
import { PestanasPrestamoBatas } from "@/components/admin/prestamo-batas/pestanas-prestamo-batas";
import {
  contarPendientesPanel,
  listarPostulacionesPendientes,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export default async function PaginaAdminPostulaciones() {
  const [postulaciones, pendientes] = await Promise.all([
    listarPostulacionesPendientes(),
    contarPendientesPanel(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">
          Postulaciones de voluntarios
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Estudiantes que quieren atender el salón. Al aprobar, asígnalos a los turnos que
          correspondan; cada turno admite a dos voluntarios y los llenos no se pueden elegir.
        </p>
      </div>

      <PestanasPrestamoBatas
        activa="postulaciones"
        postulaciones={pendientes.postulaciones}
        comprobantes={pendientes.comprobantes}
      />

      <ListaPostulacionesVoluntario postulaciones={postulaciones} />
    </div>
  );
}
