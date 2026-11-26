import Image from "next/image";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { TarjetaIntegrante } from "@/components/organizaciones/junta-directiva";
import { RedesSociales } from "@/components/organizaciones/redes-sociales";
import { obtenerAsociacionGeneral } from "@/lib/inicio/consultas-asociacion";
import { obtenerRedesAeuvg } from "@/lib/inicio/consultas-inicio";

// Lee la información institucional desde la base en cada petición.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sobre AEUVG",
  description:
    "Misión, visión y junta directiva de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala.",
};

function BloqueVacio({ titulo }: { titulo: string }) {
  return (
    <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed p-8 text-sm">
      <p className="text-texto font-bold">{titulo}</p>
      <p className="mt-2 leading-relaxed">
        AEUVG todavía no ha entregado esta información. Se publicará en cuanto la Junta Directiva la
        proporcione.
      </p>
    </div>
  );
}

export default async function PaginaSobreAeuvg() {
  const [asociacion, redes] = await Promise.all([obtenerAsociacionGeneral(), obtenerRedesAeuvg()]);

  return (
    <MarcoSitio>
      {/* La presentación iba sobre una franja morada a magenta a todo lo
          ancho. Con el fondo crema del resto del sitio se leía como un parche
          de otra página, así que ahora es una tarjeta del mismo lenguaje que
          las demás: color propio, pero en los tonos suaves del tema. */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="border-borde bg-superficie relative overflow-hidden rounded-[1.5rem] border p-7 sm:p-12">
          <span
            aria-hidden
            className="bg-primario/15 pointer-events-none absolute -top-16 -right-16 size-56 rounded-full blur-3xl"
          />
          <span
            aria-hidden
            className="bg-turquesa/15 pointer-events-none absolute -right-4 -bottom-24 size-44 rounded-full blur-3xl"
          />

          {/* El logotipo no tiene fondo transparente, así que su recuadro va
              en blanco: sobre un tinte de color se vería el cuadro del PNG. */}
          <span className="bg-superficie ring-borde relative inline-flex items-center justify-center rounded-2xl p-2.5 shadow-sm ring-1">
            <Image src="/logo-aeuvg.png" alt="" width={40} height={40} className="rounded-lg" />
          </span>

          <h1 className="text-texto relative mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Sobre AEUVG
          </h1>
          <p className="text-texto-suave relative mt-3 max-w-3xl text-lg leading-relaxed">
            Asociación General de Estudiantes de la Universidad del Valle de Guatemala.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 pt-12 pb-16 sm:px-6">
        <section>
          <h2 className="text-texto text-2xl font-extrabold tracking-tight">Quiénes somos</h2>
          <div className="mt-4">
            {asociacion?.descripcion ? (
              <p className="text-texto-suave max-w-3xl leading-relaxed">{asociacion.descripcion}</p>
            ) : (
              <BloqueVacio titulo="Presentación pendiente" />
            )}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="bg-turquesa/12 rounded-[1.25rem] p-8">
            <h2 className="text-texto text-xl font-extrabold">Misión</h2>
            <p className="text-texto-suave mt-3 leading-relaxed">
              {asociacion?.mision ?? "Pendiente de entrega por parte de AEUVG."}
            </p>
          </div>
          <div className="bg-coral/12 rounded-[1.25rem] p-8">
            <h2 className="text-texto text-xl font-extrabold">Visión</h2>
            <p className="text-texto-suave mt-3 leading-relaxed">
              {asociacion?.vision ?? "Pendiente de entrega por parte de AEUVG."}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-texto text-2xl font-extrabold tracking-tight">Junta Directiva</h2>
          <p className="text-texto-suave mt-2 max-w-3xl leading-relaxed">
            Las personas electas por el estudiantado para representarlo y coordinar el trabajo de la
            asociación durante el periodo vigente.
          </p>
          <div className="mt-8">
            {asociacion && asociacion.integrantes.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {asociacion.integrantes.map((integrante, indice) => (
                  <TarjetaIntegrante
                    key={integrante.idIntegrante}
                    integrante={integrante}
                    indice={indice}
                  />
                ))}
              </div>
            ) : (
              <BloqueVacio titulo="Integrantes pendientes" />
            )}
          </div>
        </section>

        {(asociacion?.correo ||
          asociacion?.telefono ||
          asociacion?.informacionContacto ||
          redes.length > 0) && (
          <section className="bg-superficie-suave rounded-[1.25rem] p-8">
            <h2 className="text-texto text-2xl font-extrabold tracking-tight">Contacto</h2>
            {asociacion?.correo && (
              <p className="text-texto-suave mt-3">
                <a href={`mailto:${asociacion.correo}`} className="text-primario font-semibold">
                  {asociacion.correo}
                </a>
              </p>
            )}
            {asociacion?.telefono && (
              <p className="text-texto-suave mt-2">
                <a
                  href={`tel:${asociacion.telefono.replace(/[^\d+]/g, "")}`}
                  className="text-primario font-semibold"
                >
                  {asociacion.telefono}
                </a>
              </p>
            )}
            {asociacion?.informacionContacto && (
              <p className="text-texto-suave mt-2 leading-relaxed">
                {asociacion.informacionContacto}
              </p>
            )}

            <RedesSociales redes={redes} className="mt-5" />
          </section>
        )}
      </div>
    </MarcoSitio>
  );
}
