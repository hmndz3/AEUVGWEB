import { PestanasTutorias } from "@/components/admin/pestanas-tutorias";
import { RevisionHorasTutorias } from "@/components/admin/revision-horas-tutorias";
import {
  contarPostulacionesPorEstado,
  contarTutoriasPendientesDeHoras,
  listarCursosPanel,
  listarTutoriasPendientesDeHoras,
  listarTutoriasRevisadas,
} from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export default async function PaginaAdminHorasTutorias() {
  const [pendientes, revisadas, conteo, cursos, porRevisar] = await Promise.all([
    listarTutoriasPendientesDeHoras(),
    listarTutoriasRevisadas(),
    contarPostulacionesPorEstado(),
    listarCursosPanel(),
    contarTutoriasPendientesDeHoras(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Tutorías</h1>
        <p className="text-texto-suave mt-2 max-w-3xl text-sm leading-relaxed">
          Horas beca de las tutorías dadas. El tutor sube una prueba del inicio y otra del final, y
          el estudiante confirma con una foto que el tutor se presentó. Al aceptar las horas entran
          al módulo de horas beca del tutor como pendientes de acreditar.
        </p>
      </div>

      <PestanasTutorias
        activa="horas"
        pendientes={conteo.PENDIENTE}
        propuestos={cursos.filter((curso) => curso.propuesto).length}
        horasPorRevisar={porRevisar}
      />

      <RevisionHorasTutorias pendientes={pendientes} revisadas={revisadas} />
    </div>
  );
}
