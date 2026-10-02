import Link from "next/link";

// Seis accesos en dos filas de tres. Asociaciones y clubes se separaron en este
// sprint: desde que cada sección tiene su propio listado, un acceso compartido
// obligaba a entrar a una para llegar a la otra.
const ACCESOS = [
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
    href: "/iniciar-sesion",
    titulo: "Horas beca",
    descripcion: "Inicia sesión para revisar tus horas realizadas, acreditadas y pendientes.",
    clase: "bg-turquesa/15 text-[#00695a]",
  },
  {
    href: "/tutorias",
    titulo: "Tutorías",
    descripcion: "Encuentra tutores por curso y horario.",
    clase: "bg-ambar/20 text-[#8a5600]",
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
        {ACCESOS.map((acceso) => (
          <Link
            key={acceso.href}
            href={acceso.href}
            className={`${acceso.clase} group flex flex-col justify-between rounded-[1.25rem] p-7 transition-transform hover:scale-[1.01]`}
          >
            <div>
              <p className="text-xl font-extrabold">{acceso.titulo}</p>
              <p className="mt-2 text-sm leading-relaxed opacity-80">{acceso.descripcion}</p>
            </div>
            <span className="mt-6 text-sm font-bold">
              Entrar{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
