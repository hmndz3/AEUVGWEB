import Link from "next/link";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { DisponibilidadInventario } from "@/components/prestamo-batas/disponibilidad-inventario";
import { HorariosAtencion } from "@/components/prestamo-batas/horarios-atencion";
import { verificarAcceso } from "@/lib/auth/guardias";
import {
  esVoluntarioActivo,
  estadoPostulacionDe,
  obtenerPanoramaPublico,
} from "@/lib/prestamo-batas/consultas-prestamo-batas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Préstamo de batas",
  description:
    "Consulta la disponibilidad de batas y lentes de laboratorio, los horarios de atención del salón y postúlate como voluntario.",
};

export default async function PaginaPrestamoBatas() {
  const acceso = await verificarAcceso();
  const idUsuario = acceso.tipo === "autorizado" ? acceso.usuario.idUsuario : null;

  const [panorama, voluntario, postulacion] = await Promise.all([
    obtenerPanoramaPublico(),
    idUsuario !== null ? esVoluntarioActivo(idUsuario) : Promise.resolve(false),
    idUsuario !== null ? estadoPostulacionDe(idUsuario) : Promise.resolve(null),
  ]);

  return (
    <MarcoSitio>
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
            Préstamo de batas y lentes
          </h1>
          <p className="text-texto-suave max-w-2xl leading-relaxed">
            En el salón de préstamo puedes pedir prestada una bata o unos lentes de protección para
            tus laboratorios si no llevaste los tuyos. Aquí ves cuántos hay disponibles y a qué
            horas hay voluntarios atendiendo. Al terminar, devuélvelos para que otra persona pueda
            usarlos.
          </p>
        </header>

        {/* Acceso al voluntariado: panel si ya atiende, estado si postuló, o la
            invitación a postularse. */}
        <div className="border-primario/30 bg-primario-suave flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border p-5">
          {voluntario ? (
            <>
              <div>
                <p className="text-texto text-sm font-bold">Eres voluntario del salón</p>
                <p className="text-texto-suave mt-0.5 text-sm">
                  Registra préstamos, la lista negra y tus comprobantes de horas desde tu panel.
                </p>
              </div>
              <Link
                href="/prestamo-batas/panel"
                className="text-primario text-sm font-bold hover:underline"
              >
                Ir a mi panel de voluntario →
              </Link>
            </>
          ) : postulacion?.estado === "pendiente" ? (
            <div>
              <p className="text-texto text-sm font-bold">Tu postulación está en revisión</p>
              <p className="text-texto-suave mt-0.5 text-sm">
                AEUVG te avisará cuando te asigne a tus turnos.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-texto text-sm font-bold">¿Quieres ser voluntario?</p>
                <p className="text-texto-suave mt-0.5 text-sm">
                  Atiende el salón en los horarios que te queden y gana horas beca por hacerlo.
                </p>
              </div>
              <Link
                href="/prestamo-batas/postular"
                className="text-primario text-sm font-bold hover:underline"
              >
                Postularme como voluntario →
              </Link>
            </>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-texto text-xl font-bold">Disponibilidad ahora mismo</h2>
          <DisponibilidadInventario inventario={panorama.inventario} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-texto text-xl font-bold">Horarios de atención</h2>
          <HorariosAtencion dias={panorama.dias} />
        </section>
      </div>
    </MarcoSitio>
  );
}
