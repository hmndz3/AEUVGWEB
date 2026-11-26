import Link from "next/link";

import { SECCIONES_ADMIN, type SeccionAdmin } from "@/components/admin/secciones";

type RutaSeccion = Exclude<SeccionAdmin["href"], "/admin">;

/** Dato breve de cada sección, calculado por la página del resumen. */
export type DatosSecciones = Partial<Record<RutaSeccion, string>>;

/*
 * Ícono y color de cada sección. Las clases se escriben completas porque
 * Tailwind solo genera las que encuentra literalmente en el código.
 */
const APARIENCIA: Record<RutaSeccion, { acento: string; trazo: React.ReactNode }> = {
  "/admin/estudiantes": {
    acento: "bg-primario/12 text-primario",
    trazo: (
      <>
        <circle cx="9" cy="8" r="3.25" />
        <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M15.5 5.2a3.25 3.25 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 5.3" />
      </>
    ),
  },
  "/admin/eventos": {
    acento: "bg-turquesa/15 text-sobre-turquesa",
    trazo: <path d="M5 20.5V4.5M5 5h11.5l-2 3.75 2 3.75H5M5 20.5h3" />,
  },
  "/admin/calendario": {
    acento: "bg-cielo/15 text-sobre-cielo",
    trazo: (
      <>
        <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
        <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </>
    ),
  },
  "/admin/sobre-aeuvg": {
    acento: "bg-magenta/12 text-sobre-magenta",
    trazo: (
      <>
        <path d="M12 3.5 20 8v1.5H4V8l8-4.5Z" />
        <path d="M6 9.5v8M10 9.5v8M14 9.5v8M18 9.5v8M3.5 20.5h17" />
      </>
    ),
  },
  "/admin/asociaciones": {
    acento: "bg-coral/12 text-sobre-coral",
    trazo: (
      <>
        <circle cx="12" cy="7.5" r="3" />
        <circle cx="5.5" cy="10" r="2.25" />
        <circle cx="18.5" cy="10" r="2.25" />
        <path d="M7 20a5 5 0 0 1 10 0M1.75 18.5a3.75 3.75 0 0 1 5-3.5M22.25 18.5a3.75 3.75 0 0 0-5-3.5" />
      </>
    ),
  },
  "/admin/clubes": {
    acento: "bg-lavanda/15 text-sobre-lavanda",
    trazo: (
      <path d="m12 3.75 2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.55 6.99 19.2l.96-5.6L3.9 9.65l5.6-.8L12 3.75Z" />
    ),
  },
  "/admin/horas-beca": {
    acento: "bg-ambar/18 text-sobre-ambar",
    trazo: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.25 2" />
      </>
    ),
  },
  "/admin/tutorias": {
    acento: "bg-lima/18 text-sobre-lima",
    trazo: (
      <>
        <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z" />
        <path d="M6.5 11v4.75c1.4 1.5 3.4 2.25 5.5 2.25s4.1-.75 5.5-2.25V11M21.5 9v5" />
      </>
    ),
  },
  "/admin/prestamo-batas": {
    acento: "bg-cielo/15 text-sobre-cielo",
    trazo: (
      <>
        <path d="M9 3.5 12 6l3-2.5 3.5 1.8V20.5H5.5V5.3L9 3.5Z" />
        <path d="M12 6v14M9 3.5 12 6M15 3.5 12 6" />
      </>
    ),
  },
  "/admin/reportes": {
    acento: "bg-primario/12 text-primario",
    trazo: <path d="M4.5 20.5V11M10 20.5V4.5M15.5 20.5v-7M21 20.5V8M3 20.5h19" />,
  },
};

/*
 * Grupos del resumen. Separar lo que se publica en el sitio de lo que se
 * administra del estudiantado ayuda a encontrar la sección sin leer las nueve.
 */
const GRUPOS: { titulo: string; rutas: RutaSeccion[] }[] = [
  {
    titulo: "Contenido del sitio",
    rutas: [
      "/admin/eventos",
      "/admin/calendario",
      "/admin/sobre-aeuvg",
      "/admin/asociaciones",
      "/admin/clubes",
    ],
  },
  {
    titulo: "Estudiantes y programas",
    rutas: [
      "/admin/estudiantes",
      "/admin/horas-beca",
      "/admin/tutorias",
      "/admin/prestamo-batas",
      "/admin/reportes",
    ],
  },
];

function TarjetaSeccion({ seccion, dato }: { seccion: SeccionAdmin; dato?: string }) {
  const apariencia = APARIENCIA[seccion.href as RutaSeccion];

  return (
    <Link
      href={seccion.href}
      className="group border-borde bg-superficie hover:border-primario/40 focus-visible:ring-primario flex h-full flex-col gap-4 rounded-[1.25rem] border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-2xl ${apariencia.acento}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="size-6"
          >
            {apariencia.trazo}
          </svg>
        </span>
        <span
          aria-hidden
          className="text-texto-suave group-hover:bg-primario grid size-8 place-items-center rounded-full transition-colors group-hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="text-texto text-lg font-bold">{seccion.texto}</p>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">{seccion.descripcion}</p>
      </div>

      {dato && (
        <p className="bg-superficie-suave text-texto self-start rounded-full px-3 py-1 text-xs font-semibold">
          {dato}
        </p>
      )}
    </Link>
  );
}

/** Accesos directos a cada sección del panel, agrupados y con un dato de cada una. */
export function AccesosSecciones({ datos }: { datos: DatosSecciones }) {
  return (
    <div className="flex flex-col gap-8">
      {GRUPOS.map((grupo) => (
        <section key={grupo.titulo} className="flex flex-col gap-4">
          <h2 className="text-texto text-xl font-bold">{grupo.titulo}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grupo.rutas.map((ruta) => {
              const seccion = SECCIONES_ADMIN.find((candidata) => candidata.href === ruta);
              return seccion ? (
                <TarjetaSeccion key={ruta} seccion={seccion} dato={datos[ruta]} />
              ) : null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
