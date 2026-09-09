import Link from "next/link";

const ACCESOS = [
  {
    href: "/eventos",
    titulo: "Eventos y calendario",
    descripcion: "Consulta las actividades del ciclo y guarda las que te interesen.",
    clase: "bg-primario-suave text-primario",
    ancho: "md:col-span-2",
  },
  {
    href: "/iniciar-sesion",
    titulo: "Horas beca",
    descripcion: "Inicia sesión para revisar tus horas realizadas, acreditadas y pendientes.",
    clase: "bg-turquesa/15 text-[#00695a]",
    ancho: "",
  },
  {
    href: "/tutorias",
    titulo: "Tutorías",
    descripcion: "Encuentra tutores por curso y horario.",
    clase: "bg-ambar/20 text-[#8a5600]",
    ancho: "",
  },
  {
    href: "/asociaciones",
    titulo: "Asociaciones y clubes",
    descripcion: "Conoce las agrupaciones estudiantiles y cómo integrarte.",
    clase: "bg-magenta/12 text-[#a3145f]",
    ancho: "md:col-span-2",
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
            className={`${acceso.clase} ${acceso.ancho} group flex flex-col justify-between rounded-[1.25rem] p-7 transition-transform hover:scale-[1.01]`}
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
