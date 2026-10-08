import Link from "next/link";

import { TrenEventos, type VagonTren } from "@/components/inicio/tren-eventos";
import { formatearHora, partesDeFecha } from "@/lib/eventos/formato-fechas";
import { obtenerEventosTren, type EventoResumen } from "@/lib/inicio/consultas-inicio";

/**
 * Palabras del titular. Las que llevan color toman los acentos del logo en sus
 * variantes oscurecidas (las mismas de las categorías de eventos), que sí se
 * leen sobre el fondo crema; el tono original del ámbar o el turquesa no.
 */
const TITULAR: { texto: string; clase?: string }[] = [
  { texto: "Tu" },
  { texto: "comunidad,", clase: "text-[#00806b]" },
  { texto: "tus" },
  { texto: "eventos,", clase: "text-[#d93f3c]" },
  { texto: "tu" },
  { texto: "voz", clase: "text-[#a66a00]" },
  { texto: "en" },
  { texto: "UVG" },
];

/** Milisegundos entre una palabra y la siguiente al revelarse el titular. */
const PASO_REVELADO = 70;

/** Momento en que termina de revelarse el titular; lo demás aparece después. */
const FIN_TITULAR = TITULAR.length * PASO_REVELADO + 300;

function aVagon(evento: EventoResumen): VagonTren {
  const { dia, mes } = partesDeFecha(evento.fechaInicio);

  return {
    idEvento: evento.idEvento,
    nombre: evento.nombre,
    imagenUrl: evento.imagenUrl,
    dia,
    mes,
    hora: formatearHora(evento.fechaInicio),
    ubicacion: evento.ubicacion,
    categoria: evento.categoria.nombre,
    color: evento.categoria.color ?? "#6d4aff",
    destacado: evento.destacado,
  };
}

/**
 * Titular revelado palabra por palabra: cada una sube desde debajo de una
 * máscara propia, con un pequeño desfase respecto de la anterior.
 *
 * El texto completo va en aria-label y las palabras se ocultan a los lectores
 * de pantalla, que de otro modo podrían leerlas como fragmentos sueltos.
 */
function Titular() {
  const frase = TITULAR.map((palabra) => palabra.texto).join(" ");

  return (
    <h1
      aria-label={frase}
      className="max-w-4xl text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
    >
      {TITULAR.map((palabra, indice) => (
        <span key={indice} aria-hidden>
          {/* El relleno inferior evita que la máscara corte los descendentes. */}
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span
              className={`animate-revelar inline-block motion-reduce:animate-none ${palabra.clase ?? ""}`}
              style={{ animationDelay: `${indice * PASO_REVELADO}ms` }}
            >
              {palabra.texto}
            </span>
          </span>{" "}
        </span>
      ))}
    </h1>
  );
}

export async function SeccionPrincipal() {
  const eventos = await obtenerEventosTren();

  return (
    // Mismo fondo crema que el resto del sitio: la portada no es una página
    // aparte, y lo que llama la atención son las imágenes de los eventos.
    <section className="text-texto overflow-hidden">
      <div className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Titular />

          <p
            className="animate-aparecer text-texto-suave mt-6 max-w-2xl text-lg leading-relaxed motion-reduce:animate-none"
            style={{ animationDelay: `${FIN_TITULAR}ms` }}
          >
            La plataforma de la Asociación General de Estudiantes para descubrir eventos, conocer
            asociaciones y clubes, encontrar tutorías y llevar el control de tus horas beca.
          </p>
        </div>

        {eventos.length > 0 && (
          <div
            className="animate-aparecer mt-10 motion-reduce:animate-none"
            style={{ animationDelay: `${FIN_TITULAR + 200}ms` }}
          >
            <TrenEventos vagones={eventos.map(aVagon)} />
          </div>
        )}

        <div
          className="animate-aparecer mx-auto mt-10 flex max-w-7xl flex-wrap gap-3 px-4 motion-reduce:animate-none sm:px-6"
          style={{ animationDelay: `${FIN_TITULAR + 400}ms` }}
        >
          <Link
            href="/eventos"
            className="bg-primario hover:bg-primario-fuerte inline-flex h-12 items-center rounded-full px-7 text-sm font-bold text-white shadow-lg transition-colors"
          >
            Ver próximos eventos
          </Link>
          <Link
            href="/sobre-aeuvg"
            className="text-texto ring-borde hover:bg-superficie inline-flex h-12 items-center rounded-full px-7 text-sm font-bold ring-1 transition-colors"
          >
            Conocer AEUVG
          </Link>
        </div>
      </div>
    </section>
  );
}
