import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { FormularioPostulacion } from "@/components/tutorias/formulario-postulacion";
import { Alerta } from "@/components/ui/alerta";
import { verificarAcceso } from "@/lib/auth/guardias";
import {
  listarCursos,
  obtenerPostulacionDeEstudiante,
  obtenerTutorDeUsuario,
} from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Postularme como tutor",
  description:
    "Postúlate para dar tutorías a otros estudiantes de la Universidad del Valle de Guatemala.",
};

export default async function PaginaPostular() {
  const acceso = await verificarAcceso();

  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/tutorias/postular");

  const [cursos, postulacion, tutor] = await Promise.all([
    listarCursos(),
    obtenerPostulacionDeEstudiante(acceso.usuario.idUsuario),
    obtenerTutorDeUsuario(acceso.usuario.idUsuario),
  ]);

  const pendiente = postulacion?.estado === "PENDIENTE";

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link href="/tutorias" className="text-primario text-sm font-bold hover:underline">
            ← Volver a las tutorías
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Postularme como tutor
          </h1>
          <p className="text-texto-suave mt-3 leading-relaxed">
            Elige los cursos que te gustaría impartir y adjunta el comprobante de la nota que
            obtuviste en cada uno. AEUVG revisa la postulación y, si la aprueba, apareces en el
            directorio de tutores.
          </p>
        </div>

        {tutor && (
          <Alerta tipo="informativo" titulo="Ya eres tutor">
            Tu ficha está en el directorio. Si quieres impartir otro curso, escríbele a AEUVG desde
            tu sección de tutorías.
          </Alerta>
        )}

        {!tutor && pendiente && (
          <Alerta tipo="informativo" titulo="Ya tienes una postulación en revisión">
            AEUVG la está revisando y te avisará cuando la resuelva. Mientras tanto no puedes enviar
            otra.
          </Alerta>
        )}

        {!tutor && !pendiente && cursos.length === 0 && (
          <Alerta tipo="informativo" titulo="Todavía no hay cursos disponibles">
            AEUVG aún no ha cargado el catálogo de cursos para tutorías. Vuelve a revisar más
            adelante.
          </Alerta>
        )}

        {!tutor && !pendiente && cursos.length > 0 && <FormularioPostulacion cursos={cursos} />}
      </div>
    </MarcoSitio>
  );
}
