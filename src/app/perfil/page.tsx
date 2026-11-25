import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { DatosPerfil } from "@/components/perfil/datos-perfil";
import { EventosGuardadosPerfil } from "@/components/perfil/eventos-guardados";
import { FotoPerfil } from "@/components/perfil/foto-perfil";
import { HorasBecaPerfil } from "@/components/perfil/horas-beca";
import { InteresesPerfil } from "@/components/perfil/intereses";
import { RecomendacionesPerfil } from "@/components/perfil/recomendaciones";
import { TutoriasPerfil } from "@/components/perfil/tutorias";
import { verificarAcceso } from "@/lib/auth/guardias";
import { listarCategorias } from "@/lib/eventos/consultas-eventos";
import { obtenerEventosGuardados } from "@/lib/perfil/consultas-eventos-guardados";
import {
  obtenerInteresesDeCategorias,
  recomendarEventos,
} from "@/lib/personalizacion/consultas-personalizacion";
import { obtenerHorasBecaEstudiante } from "@/lib/perfil/consultas-horas-beca";
import { listarFacultadesDisponibles, obtenerPerfil } from "@/lib/perfil/consultas-perfil";
import {
  listarTutoriasDeEstudiante,
  obtenerPostulacionDeEstudiante,
  obtenerTutorDeUsuario,
} from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mi perfil",
  description: "Datos personales, carrera y actividad de tu cuenta en la plataforma de AEUVG.",
};

export default async function PaginaPerfil() {
  const acceso = await verificarAcceso();

  // Sin rol requerido: cualquier cuenta con sesión alcanza su propio perfil.
  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/perfil");

  const ahora = new Date();
  const [
    perfil,
    facultades,
    guardados,
    horas,
    tutorias,
    postulacion,
    tutor,
    categorias,
    intereses,
    recomendados,
  ] = await Promise.all([
    obtenerPerfil(acceso.usuario.idUsuario),
    listarFacultadesDisponibles(),
    obtenerEventosGuardados(acceso.usuario.idUsuario, { ahora }),
    obtenerHorasBecaEstudiante(acceso.usuario.idUsuario),
    listarTutoriasDeEstudiante(acceso.usuario.idUsuario),
    obtenerPostulacionDeEstudiante(acceso.usuario.idUsuario),
    obtenerTutorDeUsuario(acceso.usuario.idUsuario),
    listarCategorias(),
    obtenerInteresesDeCategorias(acceso.usuario.idUsuario),
    recomendarEventos(acceso.usuario.idUsuario, ahora),
  ]);

  // La sesión es válida pero la cuenta ya no está: lo más seguro es volver al
  // inicio de sesión en lugar de mostrar una pantalla a medias.
  if (!perfil) redirect("/iniciar-sesion");

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6">
        <DatosPerfil perfil={perfil} facultades={facultades} />

        <FotoPerfil
          nombre={perfil.nombreCompleto}
          fotoUrl={perfil.fotoUrl}
          esTutor={tutor !== null}
        />

        <HorasBecaPerfil horas={horas} />

        <TutoriasPerfil tutorias={tutorias} postulacion={postulacion} tutor={tutor} />

        <RecomendacionesPerfil
          eventos={recomendados}
          ahora={ahora}
          sinIntereses={intereses.length === 0}
        />

        <EventosGuardadosPerfil eventos={guardados} ahora={ahora} />

        <InteresesPerfil categorias={categorias} elegidas={intereses} />
      </div>
    </MarcoSitio>
  );
}
