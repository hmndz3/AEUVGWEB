import Link from "next/link";

import { FormularioCurso, TablaCursos } from "@/components/admin/catalogo-cursos";
import { PestanasTutorias } from "@/components/admin/pestanas-tutorias";
import { Boton } from "@/components/ui/boton";
import { contarPostulacionesPorEstado, listarCursosPanel } from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export default async function PaginaAdminCursos() {
  const [cursos, conteo] = await Promise.all([listarCursosPanel(), contarPostulacionesPorEstado()]);

  const propuestos = cursos.filter((curso) => curso.propuesto).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-texto text-3xl font-extrabold tracking-tight">Tutorías</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Cursos que se ofrecen al postularse como tutor y en el directorio. Si un estudiante no
          encuentra el suyo, lo propone con la opción Otro: aparece aquí como propuesto y entra al
          catálogo al aprobar su postulación o al admitirlo desde esta lista.
        </p>
      </div>

      <PestanasTutorias activa="cursos" pendientes={conteo.PENDIENTE} propuestos={propuestos} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-texto text-lg font-bold">Agregar un curso</h2>
          <Link href="/admin/tutorias/cursos/importar">
            <Boton variante="contorno">Importar desde Excel</Boton>
          </Link>
        </div>
        <FormularioCurso />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-texto text-lg font-bold">Catálogo</h2>
        {cursos.length === 0 ? (
          <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-12 text-center text-sm">
            Todavía no hay cursos. Agrega el primero para que los estudiantes puedan elegirlo.
          </div>
        ) : (
          <TablaCursos cursos={cursos} />
        )}
      </section>
    </div>
  );
}
