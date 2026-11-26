import Link from "next/link";
import { redirect } from "next/navigation";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { ListaTutorias } from "@/components/tutorias/lista-tutorias";
import { verificarAcceso } from "@/lib/auth/guardias";
import { listarTutoriasDeTutor, obtenerTutorDeUsuario } from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutorías que me solicitaron",
  description: "Las tutorías que el estudiantado agendó contigo.",
};

function Indicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4">
      <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">{titulo}</p>
      <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{valor}</p>
    </div>
  );
}

export default async function PaginaSolicitudes() {
  const acceso = await verificarAcceso();

  if (acceso.tipo !== "autorizado") redirect("/iniciar-sesion?continuar=/tutorias/solicitudes");

  const tutor = await obtenerTutorDeUsuario(acceso.usuario.idUsuario);
  if (!tutor) redirect("/tutorias/postular");

  const tutorias = await listarTutoriasDeTutor(acceso.usuario.idUsuario);

  // En pie son las dos primeras: la que espera respuesta y la ya aceptada,
  // que es donde el tutor sube sus pruebas. Si la aceptada cayera en el
  // historial, el tutor no encontraría dónde dar la tutoría por impartida.
  const enPie = tutorias.filter(
    (tutoria) => tutoria.estado === "PROGRAMADA" || tutoria.estado === "ACEPTADA"
  );
  const porResponder = tutorias.filter((tutoria) => tutoria.estado === "PROGRAMADA").length;
  const completadas = tutorias.filter((tutoria) => tutoria.estado === "COMPLETADA").length;
  const pasadas = tutorias.filter(
    (tutoria) => tutoria.estado !== "PROGRAMADA" && tutoria.estado !== "ACEPTADA"
  );

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link href="/tutorias/panel" className="text-primario text-sm font-bold hover:underline">
            ← Volver a mi panel de tutor
          </Link>
          <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
            Tutorías que me solicitaron
          </h1>
          <p className="text-texto-suave mt-2 leading-relaxed">
            Las que tienes por delante y las que ya pasaron. Acepta o rechaza las que te soliciten,
            y cuando des una, márcala como dada con la prueba del inicio y la del final: es lo que
            respalda tus horas beca y tu ficha ante quien te elige.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Indicador titulo="Por responder" valor={porResponder} />
          <Indicador titulo="Por delante" valor={enPie.length} />
          <Indicador titulo="Dadas" valor={completadas} />
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-texto text-lg font-bold">Próximas</h2>
          <ListaTutorias tutorias={enPie} comoTutor />
        </section>

        {/* El historial va aparte y debajo: lo que se viene es lo que se
            consulta, y mezclarlo con lo pasado obliga a buscarlo cada vez. */}
        {pasadas.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-texto text-lg font-bold">Historial</h2>
            <ListaTutorias tutorias={pasadas} comoTutor />
          </section>
        )}
      </div>
    </MarcoSitio>
  );
}
