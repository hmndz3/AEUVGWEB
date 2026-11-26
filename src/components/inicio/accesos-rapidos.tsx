import Link from "next/link";

import { Icono } from "@/components/ui/icono";

/**
 * Acceso de la portada. Sin `href` la tarjeta se presenta igual pero no es un
 * enlace: así la rejilla conserva sus dos filas de tres y el estudiantado ve
 * qué viene, en lugar de encontrarse una pantalla de error.
 */
type Acceso = {
  href?: string;
  titulo: string;
  descripcion: string;
  /** Fondo y color de acento de la tarjeta. */
  clase: string;
  icono: React.ComponentProps<typeof Icono>["nombre"];
  /** Aviso en lugar del "Entrar", cuando la sección todavía no existe. */
  nota?: string;
};

// Seis accesos en dos filas de tres. Asociaciones y clubes se separaron en este
// sprint: desde que cada sección tiene su propio listado, un acceso compartido
// obligaba a entrar a una para llegar a la otra.
const ACCESOS: Acceso[] = [
  {
    href: "/eventos",
    titulo: "Eventos",
    descripcion: "Consulta las actividades del ciclo, con sus fechas, lugares y organizadores.",
    clase: "bg-primario-suave text-sobre-primario-suave",
    icono: "boleto",
  },
  {
    href: "/calendario",
    titulo: "Calendario",
    descripcion: "Revisa el mes o la semana completa de un vistazo.",
    clase: "bg-cielo/15 text-sobre-cielo",
    icono: "calendario",
  },
  {
    href: "/asociaciones",
    titulo: "Asociaciones",
    descripcion: "Conoce las asociaciones de facultad y de carrera, y a quienes las integran.",
    clase: "bg-magenta/12 text-sobre-magenta",
    icono: "personas",
  },
  {
    href: "/clubes",
    titulo: "Clubes",
    descripcion: "Encuentra el club que va con lo tuyo y cómo integrarte.",
    clase: "bg-lavanda/20 text-sobre-lavanda",
    icono: "estrella",
  },
  {
    // Apuntaba a /iniciar-sesion, y con la sesión ya iniciada el middleware
    // devuelve esa ruta al inicio: la tarjeta parecía no hacer nada. Ahora
    // lleva a la sección del perfil, y a quien no tenga sesión el middleware lo
    // manda a iniciarla y lo trae de vuelta aquí.
    href: "/perfil#mis-horas-beca",
    titulo: "Horas beca",
    descripcion: "Revisa tus horas realizadas, acreditadas y pendientes.",
    clase: "bg-turquesa/15 text-sobre-turquesa",
    icono: "escudo",
  },
  {
    href: "/tutorias",
    titulo: "Tutorías",
    descripcion: "Encuentra tutores por curso y horario, y solicita una tutoría.",
    clase: "bg-ambar/20 text-sobre-ambar",
    icono: "graduacion",
  },
];

/**
 * Contenido de una tarjeta.
 *
 * El icono aparece dos veces a propósito: pequeño arriba, para identificar la
 * sección de un vistazo, y enorme y casi transparente en la esquina, como
 * textura. Es lo que le da carácter a la rejilla sin meter una ilustración
 * distinta por tarjeta.
 */
function ContenidoAcceso({ acceso }: { acceso: Acceso }) {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-5 -bottom-6 opacity-[0.13] transition-transform duration-300 group-hover:scale-110"
      >
        <Icono nombre={acceso.icono} className="size-28 sm:size-36" />
      </span>

      <span className="bg-superficie/80 relative inline-flex size-10 items-center justify-center rounded-2xl shadow-sm sm:size-12">
        <Icono nombre={acceso.icono} className="size-5 sm:size-6" />
      </span>

      <p className="relative mt-3 text-base font-extrabold sm:mt-4 sm:text-xl">{acceso.titulo}</p>
      <p className="relative mt-1.5 text-[0.8rem] leading-snug opacity-80 sm:mt-2 sm:text-sm sm:leading-relaxed">
        {acceso.descripcion}
      </p>

      {acceso.href ? (
        <span className="relative mt-auto flex items-center justify-between gap-2 pt-4 sm:pt-6">
          <span className="text-xs font-bold sm:text-sm">Entrar</span>
          <span
            aria-hidden
            className="bg-superficie/70 inline-flex size-8 items-center justify-center rounded-full ring-1 ring-current/15 transition-transform group-hover:translate-x-1 sm:size-9"
          >
            <Icono nombre="flecha" className="size-4" />
          </span>
        </span>
      ) : (
        <span className="relative mt-auto self-start rounded-full bg-current/10 px-3 py-1 text-xs font-bold">
          {acceso.nota}
        </span>
      )}
    </>
  );
}

export function AccesosRapidos() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-texto text-3xl font-extrabold tracking-tight">Explora</h2>
      <p className="text-texto-suave mt-2 max-w-2xl">
        Todo lo que necesitas de tu vida universitaria, en un solo lugar.
      </p>

      {/* Dos columnas desde el teléfono: con una sola, seis tarjetas de esta
          altura obligaban a desplazarse media pantalla por sección. */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
        {ACCESOS.map((acceso) => {
          const clases = `${acceso.clase} group relative flex flex-col overflow-hidden rounded-[1.25rem] p-4 ring-1 ring-current/10 sm:rounded-[1.5rem] sm:p-7`;

          // Sin destino no se dibuja un enlace: no recibe foco ni se anuncia
          // como navegable, y tampoco reacciona al cursor, para que nadie la
          // pulse esperando que lleve a algún lado.
          return acceso.href ? (
            <Link
              key={acceso.titulo}
              href={acceso.href}
              className={`${clases} transition-transform hover:-translate-y-0.5 motion-reduce:transform-none`}
            >
              <ContenidoAcceso acceso={acceso} />
            </Link>
          ) : (
            <div key={acceso.titulo} className={clases}>
              <ContenidoAcceso acceso={acceso} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
