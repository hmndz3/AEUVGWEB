import { PestanasTutorias } from "@/components/admin/pestanas-tutorias";
import { TablaTutores } from "@/components/admin/tabla-tutores";
import {
  contarPostulacionesPorEstado,
  listarTutoresPanel,
} from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export default async function PaginaAdminTutorias() {
  const [tutores, conteo] = await Promise.all([
    listarTutoresPanel(),
    contarPostulacionesPorEstado(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Tutorías</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Tutores aprobados con sus cursos. Un tutor inactivo o suspendido desaparece del
          directorio, pero conserva sus tutorías realizadas y vuelve en cuanto se reactive.
        </p>
      </div>

      <PestanasTutorias activa="tutores" pendientes={conteo.PENDIENTE} />

      <section className="flex flex-col gap-4">
        {tutores.length === 0 ? (
          <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
            Todavía no hay tutores. Aprueba una postulación para dar de alta al primero.
          </div>
        ) : (
          <TablaTutores tutores={tutores} />
        )}
      </section>
    </div>
  );
}
