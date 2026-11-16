import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { ListaNotificaciones } from "@/components/notificaciones/lista-notificaciones";
import { verificarAcceso } from "@/lib/auth/guardias";
import { listarNotificaciones } from "@/lib/notificaciones/consultas-notificaciones";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notificaciones",
  description: "Avisos de tu cuenta en la plataforma de AEUVG.",
};

export default async function PaginaNotificaciones() {
  const acceso = await verificarAcceso();

  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/notificaciones");

  const notificaciones = await listarNotificaciones(acceso.usuario.idUsuario);

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
            Notificaciones
          </h1>
          <p className="text-texto-suave mt-3 leading-relaxed">
            Lo que ha pasado con tus postulaciones, tus tutorías y tus horas beca.
          </p>
        </div>

        <ListaNotificaciones notificaciones={notificaciones} />
      </div>
    </MarcoSitio>
  );
}
