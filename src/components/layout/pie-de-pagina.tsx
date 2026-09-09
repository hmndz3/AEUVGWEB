import Image from "next/image";
import Link from "next/link";

const SECCIONES = [
  {
    titulo: "Navegación",
    enlaces: [
      { href: "/", texto: "Inicio" },
      { href: "/eventos", texto: "Eventos" },
      { href: "/sobre-aeuvg", texto: "Sobre AEUVG" },
    ],
  },
  {
    titulo: "Vida estudiantil",
    enlaces: [
      { href: "/asociaciones", texto: "Asociaciones" },
      { href: "/clubes", texto: "Clubes" },
      { href: "/tutorias", texto: "Tutorías" },
    ],
  },
];

export function PieDePagina() {
  return (
    <footer className="bg-texto mt-auto text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-aeuvg.png"
              alt="AEUVG"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="font-extrabold">AEUVG</span>
          </div>
          <p className="text-sm text-white/70">
            Asociación General de Estudiantes de la Universidad del Valle de Guatemala.
          </p>
        </div>

        {SECCIONES.map((seccion) => (
          <div key={seccion.titulo} className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{seccion.titulo}</p>
            {seccion.enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {enlace.texto}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50 sm:px-6">
        © {new Date().getFullYear()} Asociación General de Estudiantes de la Universidad del Valle
        de Guatemala
      </div>
    </footer>
  );
}
