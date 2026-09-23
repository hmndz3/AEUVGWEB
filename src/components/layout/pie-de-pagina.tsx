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
  {
    titulo: "Tu cuenta",
    enlaces: [
      { href: "/crear-cuenta", texto: "Crear cuenta" },
      { href: "/iniciar-sesion", texto: "Iniciar sesión" },
      { href: "/recuperar-contrasena", texto: "Recuperar contraseña" },
    ],
  },
];

export function PieDePagina() {
  return (
    <footer className="bg-texto mt-auto text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            aria-label="AEUVG, ir a la página principal"
            className="flex w-fit items-center gap-3 rounded-full transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Image
              src="/logo-aeuvg.png"
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full"
            />
            <span className="text-lg font-extrabold">AEUVG</span>
          </Link>
          <p className="text-sm leading-relaxed text-white/70">
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
