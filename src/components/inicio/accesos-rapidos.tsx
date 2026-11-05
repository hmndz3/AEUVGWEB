import Link from "next/link";

/**
 * Acceso de la portada. Sin `href` la tarjeta se presenta igual pero no es un
 * enlace: así la rejilla conserva sus dos filas de tres y el estudiantado ve
 * qué viene, en lugar de encontrarse una pantalla de error.
 */
type Acceso = {
  href?: string;
  titulo: string;
  descripcion: string;
  clase: string;
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
    clase: "bg-primario-suave text-primario",
  },
  {
    href: "/calendario",
    titulo: "Calendario",
    descripcion: "Revisa el mes o la semana completa de un vistazo.",
    clase: "bg-cielo/15 text-[#0b5f8a]",
  },
  {
    href: "/asociaciones",
    titulo: "Asociaciones",
    descripcion: "Conoce las asociaciones de facultad y de carrera, y a quienes las integran.",
    clase: "bg-magenta/12 text-[#a3145f]",
  },
  {
    href: "/clubes",
    titulo: "Clubes",
    descripcion: "Encuentra el club que va con lo tuyo y cómo integrarte.",
    clase: "bg-lavanda/20 text-[#5a35e8]",
  },
  {
    // Apuntaba a /iniciar-sesion, y con la sesión ya iniciada el middleware
    // devuelve esa ruta al inicio: la tarjeta parecía no hacer nada. Ahora
    // lleva a la sección del perfil, y a quien no tenga sesión el middleware lo
    // manda a iniciarla y lo trae de vuelta aquí.
    href: "/perfil#mis-horas-beca",
    titulo: "Horas beca",
    descripcion: "Revisa tus horas realizadas, acreditadas y pendientes.",
    clase: "bg-turquesa/15 text-[#00695a]",
  },
  {
    // La ruta /tutorias no existe todavía: el módulo completo (directorio de
    // tutores, postulaciones y horarios) se entrega en el Sprint 6. Hasta
    // entonces la tarjeta se queda sin enlace, porque enlazarla devolvía un 404
    // desde la portada.
    titulo: "Tutorías",
    descripcion: "Encuentra tutores por curso y horario.",
    clase: "bg-ambar/20 text-[#8a5600]",
    nota: "Próximamente este ciclo",
  },
];

export function AccesosRapidos() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h2 className="text-texto text-3xl font-extrabold tracking-tight">Explora</h2>
      <p className="text-texto-suave mt-2 max-w-2xl">
        Todo lo que necesitas de tu vida universitaria, en un solo lugar.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {ACCESOS.map((acceso) => {
          const contenido = (
            <>
              <div>
                <p className="text-xl font-extrabold">{acceso.titulo}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-80">{acceso.descripcion}</p>
              </div>
              {acceso.href ? (
                <span className="mt-6 text-sm font-bold">
                  Entrar{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              ) : (
                <span className="mt-6 self-start rounded-full bg-current/10 px-3 py-1 text-xs font-bold">
                  {acceso.nota}
                </span>
              )}
            </>
          );

          const clases = `${acceso.clase} group flex flex-col justify-between rounded-[1.25rem] p-7`;

          // Sin destino no se dibuja un enlace: no recibe foco ni se anuncia
          // como navegable, y tampoco reacciona al cursor, para que nadie la
          // pulse esperando que lleve a algún lado.
          return acceso.href ? (
            <Link
              key={acceso.titulo}
              href={acceso.href}
              className={`${clases} transition-transform hover:scale-[1.01]`}
            >
              {contenido}
            </Link>
          ) : (
            <div key={acceso.titulo} className={clases}>
              {contenido}
            </div>
          );
        })}
      </div>
    </section>
  );
}
