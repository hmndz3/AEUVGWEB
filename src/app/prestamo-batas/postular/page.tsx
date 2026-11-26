import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { FormularioPostulacionVoluntario } from "@/components/prestamo-batas/formulario-postulacion-voluntario";
import { Alerta } from "@/components/ui/alerta";
import { verificarAcceso } from "@/lib/auth/guardias";
import {
  estadoPostulacionDe,
  esVoluntarioActivo,
  listarTurnosParaPostular,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Postularme como voluntario",
  description: "Postúlate para atender el salón de préstamo de batas en los horarios disponibles.",
};

export default async function PaginaPostularVoluntario() {
  const acceso = await verificarAcceso();

  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/prestamo-batas/postular");

  const [turnos, voluntario, postulacion] = await Promise.all([
    listarTurnosParaPostular(),
    esVoluntarioActivo(acceso.usuario.idUsuario),
    estadoPostulacionDe(acceso.usuario.idUsuario),
  ]);

  const pendiente = postulacion?.estado === "pendiente";

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link href="/prestamo-batas" className="text-primario text-sm font-bold hover:underline">
            ← Volver al préstamo de batas
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Postularme como voluntario
          </h1>
          <p className="text-texto-suave mt-3 leading-relaxed">
            Elige los turnos a los que puedes atender el salón. Cada turno admite a dos voluntarios;
            los que ya están completos aparecen marcados. AEUVG revisa tu postulación y te asigna a
            los turnos que correspondan.
          </p>
        </div>

        {voluntario && (
          <Alerta tipo="informativo" titulo="Ya eres voluntario">
            Puedes atender el salón desde tu panel de voluntario. Si quieres cubrir otros turnos,
            escríbele a AEUVG.
          </Alerta>
        )}

        {!voluntario && pendiente && (
          <Alerta tipo="informativo" titulo="Ya tienes una postulación en revisión">
            AEUVG la está revisando y te avisará cuando la resuelva. Mientras tanto no puedes enviar
            otra.
          </Alerta>
        )}

        {!voluntario && !pendiente && <FormularioPostulacionVoluntario turnos={turnos} />}
      </div>
    </MarcoSitio>
  );
}
