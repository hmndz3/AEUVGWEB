import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { EditorDisponibilidad } from "@/components/tutorias/editor-disponibilidad";
import { FormularioFichaTutor } from "@/components/tutorias/formulario-ficha-tutor";
import { verificarAcceso } from "@/lib/auth/guardias";
import { listarTutoriasDeTutor, obtenerTutorDeUsuario } from "@/lib/tutorias/consultas-tutorias";
import { ETIQUETAS_ESTADO_TUTOR } from "@/lib/tutorias/formato-tutorias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mi panel de tutor",
  description: "Tu ficha, tus horarios y las tutorías que te han solicitado.",
};

export default async function PaginaPanelTutor() {
  const acceso = await verificarAcceso();

  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/tutorias/panel");

  const tutor = await obtenerTutorDeUsuario(acceso.usuario.idUsuario);

  // Quien no es tutor no tiene panel: se le ofrece postularse en lugar de una
  // pantalla vacía o un error.
  if (!tutor) redirect("/tutorias/postular");

  const tutorias = await listarTutoriasDeTutor(acceso.usuario.idUsuario);
  const programadas = tutorias.filter((tutoria) => tutoria.estado === "PROGRAMADA").length;

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6">
        <div>
          <Link href="/perfil" className="text-primario text-sm font-bold hover:underline">
            ← Volver a mi perfil
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
            Mi panel de tutor
          </h1>
          <p className="text-texto-suave mt-2 leading-relaxed">
            Tu ficha está {tutor.estado === "ACTIVO" ? "publicada" : "fuera"} del directorio
            {tutor.estado === "ACTIVO"
              ? ""
              : ` (${ETIQUETAS_ESTADO_TUTOR[tutor.estado].toLocaleLowerCase("es")})`}
            . Impartes {tutor.cursos.length} {tutor.cursos.length === 1 ? "curso" : "cursos"} y
            llevas {tutor.tutoriasCompletadas}{" "}
            {tutor.tutoriasCompletadas === 1 ? "tutoría impartida" : "tutorías impartidas"}.
          </p>
          {tutor.estado === "ACTIVO" && (
            <Link
              href={`/tutorias/${tutor.idTutor}`}
              className="text-primario mt-2 inline-flex text-sm font-bold hover:underline"
            >
              Ver mi ficha como la ve el estudiantado →
            </Link>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-texto text-lg font-bold">Mis horarios</h2>
            <p className="text-texto-suave mt-1 text-sm leading-relaxed">
              Publica en qué días y horas puedes dar tutorías. Se repiten cada semana, y solo dentro
              de ellos te pueden agendar.
            </p>
          </div>

          <EditorDisponibilidad franjas={tutor.disponibilidades} />
        </section>

        {/* Las tutorías solicitadas tienen su propia pantalla: aquí se
            configuran los horarios y la ficha, y la lista de citas encima era
            ruido sobre lo que se viene a hacer. Queda el acceso con el
            pendiente a la vista, que es el dato que hace volver. */}
        <Link
          href="/tutorias/solicitudes"
          className="border-borde bg-superficie hover:bg-superficie-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5 transition-colors"
        >
          <div>
            <p className="text-texto text-sm font-bold">Tutorías que me solicitaron</p>
            <p className="text-texto-suave mt-0.5 text-sm">
              {programadas === 0
                ? "No tienes ninguna por delante."
                : `Tienes ${programadas} ${programadas === 1 ? "tutoría" : "tutorías"} por delante.`}
            </p>
          </div>
          <span className="text-primario text-sm font-bold">Ver todas →</span>
        </Link>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-texto text-lg font-bold">Mi ficha</h2>
            <p className="text-texto-suave mt-1 text-sm leading-relaxed">
              Lo que el estudiantado lee antes de elegirte.
            </p>
          </div>

          <FormularioFichaTutor
            descripcion={tutor.descripcion}
            informacionContacto={tutor.informacionContacto}
          />
        </section>
      </div>
    </MarcoSitio>
  );
}
