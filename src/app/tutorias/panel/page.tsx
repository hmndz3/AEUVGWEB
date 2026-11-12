import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { EditorDisponibilidad } from "@/components/tutorias/editor-disponibilidad";
import { FormularioFichaTutor } from "@/components/tutorias/formulario-ficha-tutor";
import { ListaTutorias } from "@/components/tutorias/lista-tutorias";
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

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-texto text-lg font-bold">Tutorías solicitadas</h2>
            <p className="text-texto-suave mt-1 text-sm leading-relaxed">
              Cuando una ya ocurrió, márcala como dada: es lo que respalda tu ficha ante quien te
              elige.
            </p>
          </div>

          <ListaTutorias tutorias={tutorias} comoTutor />
        </section>

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
