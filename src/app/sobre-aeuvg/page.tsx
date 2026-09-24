import Image from "next/image";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import {
  inicialesDeNombre,
  obtenerAsociacionGeneral,
  type IntegranteResumen,
} from "@/lib/inicio/consultas-asociacion";

// Lee la información institucional desde la base en cada petición.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sobre AEUVG",
  description:
    "Misión, visión y junta directiva de la Asociación General de Estudiantes de la Universidad del Valle de Guatemala.",
};

// Color de respaldo para las iniciales de quien no tenga fotografía cargada.
const ACENTOS = [
  "bg-primario",
  "bg-coral",
  "bg-turquesa",
  "bg-magenta",
  "bg-ambar",
  "bg-cielo",
  "bg-lima",
  "bg-lavanda",
];

function TarjetaIntegrante({
  integrante,
  indice,
}: {
  integrante: IntegranteResumen;
  indice: number;
}) {
  const acento = ACENTOS[indice % ACENTOS.length];

  return (
    <article className="group border-borde bg-superficie flex flex-col overflow-hidden rounded-[1.25rem] border shadow-sm transition-shadow hover:shadow-lg">
      {/* El retrato viene recortado sobre blanco, así que se funde con la
          tarjeta sin costura visible entre la imagen y el texto. */}
      <div className="bg-superficie relative aspect-3/4 w-full overflow-hidden">
        {integrante.fotoUrl ? (
          <Image
            src={integrante.fotoUrl}
            alt={`Fotografía de ${integrante.nombre}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className={`${acento} grid size-full place-items-center text-5xl font-extrabold text-white`}
          >
            {inicialesDeNombre(integrante.nombre)}
          </span>
        )}
      </div>

      <div className="border-borde flex flex-1 flex-col border-t px-5 py-4">
        <p className="text-texto text-base leading-snug font-bold break-words">
          {integrante.nombre}
        </p>
        <p className="text-primario mt-1 text-sm leading-snug font-semibold">{integrante.cargo}</p>
        {integrante.periodo && (
          <p className="text-texto-suave mt-auto pt-2 text-xs font-medium tracking-wide uppercase">
            Junta Directiva {integrante.periodo}
          </p>
        )}
      </div>
    </article>
  );
}

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
  const asociacion = await obtenerAsociacionGeneral();

  return (
    <MarcoSitio>
      <section className="from-primario to-magenta bg-gradient-to-br text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Sobre AEUVG</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">
            Asociación General de Estudiantes de la Universidad del Valle de Guatemala.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-16 sm:px-6">
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

        {(asociacion?.correo || asociacion?.informacionContacto) && (
          <section className="bg-superficie-suave rounded-[1.25rem] p-8">
            <h2 className="text-texto text-2xl font-extrabold tracking-tight">Contacto</h2>
            {asociacion.correo && (
              <p className="text-texto-suave mt-3">
                <a href={`mailto:${asociacion.correo}`} className="text-primario font-semibold">
                  {asociacion.correo}
                </a>
              </p>
            )}
            {asociacion.informacionContacto && (
              <p className="text-texto-suave mt-2 leading-relaxed">
                {asociacion.informacionContacto}
              </p>
            )}
          </section>
        )}
      </div>
    </MarcoSitio>
  );
}
