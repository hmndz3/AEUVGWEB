import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { DatosPerfil } from "@/components/perfil/datos-perfil";
import { EventosGuardadosPerfil } from "@/components/perfil/eventos-guardados";
import { FormularioPerfil } from "@/components/perfil/formulario-perfil";
import { verificarAcceso } from "@/lib/auth/guardias";
import { obtenerEventosGuardados } from "@/lib/perfil/consultas-eventos-guardados";
import { listarCarrerasDisponibles, obtenerPerfil } from "@/lib/perfil/consultas-perfil";

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
  const [perfil, carreras, guardados] = await Promise.all([
    obtenerPerfil(acceso.usuario.idUsuario),
    listarCarrerasDisponibles(),
    obtenerEventosGuardados(acceso.usuario.idUsuario, { ahora }),
  ]);

  // La sesión es válida pero la cuenta ya no está: lo más seguro es volver al
  // inicio de sesión en lugar de mostrar una pantalla a medias.
  if (!perfil) redirect("/iniciar-sesion");

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6">
        <DatosPerfil perfil={perfil} />

        <EventosGuardadosPerfil eventos={guardados} ahora={ahora} />

        <FormularioPerfil
          telefono={perfil.telefono}
          idCarrera={perfil.idCarrera}
          carreras={carreras}
        />
      </div>
    </MarcoSitio>
  );
}
