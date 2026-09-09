import Image from "next/image";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { Tarjeta } from "@/components/ui/tarjeta";
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

const COLORES_AVATAR = [
  "bg-primario",
  "bg-coral",
  "bg-turquesa",
  "bg-magenta",
  "bg-lima",
  "bg-cielo",
];

function TarjetaIntegrante({
  integrante,
  indice,
}: {
  integrante: IntegranteResumen;
  indice: number;
}) {
  return (
    <Tarjeta className="flex flex-col items-center text-center">
      {integrante.fotoUrl ? (
        <Image
          src={integrante.fotoUrl}
          alt={integrante.nombre}
          width={112}
          height={112}
          className="size-28 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={`${COLORES_AVATAR[indice % COLORES_AVATAR.length]} grid size-28 place-items-center rounded-full text-2xl font-extrabold text-white`}
        >
          {inicialesDeNombre(integrante.nombre)}
        </span>
      )}

      <p className="text-texto mt-4 font-bold">{integrante.nombre}</p>
      <p className="text-primario text-sm font-semibold">{integrante.cargo}</p>
      <p className="text-texto-suave mt-1 text-xs">{integrante.periodo}</p>
    </Tarjeta>
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
          <div className="mt-6">
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
