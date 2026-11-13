import Link from "next/link";

import { MarcoSitio } from "@/components/layout/marco-sitio";
import { TarjetaTutor } from "@/components/tutorias/tarjeta-tutor";
import { Boton } from "@/components/ui/boton";
import { listarCursos, listarTutoresPublicos } from "@/lib/tutorias/consultas-tutorias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutorías",
  description:
    "Encuentra tutores por curso y horario en la Universidad del Valle de Guatemala, y solicita una tutoría.",
};

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

export default async function PaginaTutorias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const crudoCurso = Array.isArray(parametros.curso) ? parametros.curso[0] : parametros.curso;
  const numero = Number(crudoCurso);
  const idCurso = Number.isSafeInteger(numero) && numero > 0 ? numero : undefined;
  const crudoQ = Array.isArray(parametros.q) ? parametros.q[0] : parametros.q;
  const q = crudoQ && crudoQ.trim().length >= 2 ? crudoQ.trim() : undefined;

  const [cursos, tutores] = await Promise.all([
    listarCursos(),
    listarTutoresPublicos({ idCurso, q }),
  ]);

  const cursoElegido = cursos.find((curso) => curso.idCurso === idCurso);

  return (
    <MarcoSitio>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-texto text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tutorías
            </h1>
            <p className="text-texto-suave mt-3 max-w-2xl leading-relaxed">
              Estudiantes que aprobaron un curso con buena nota y se ofrecen a acompañar a quien lo
              está llevando. Elige el curso, mira quién puede y solicita una tutoría en el horario
              que les acomode a los dos.
            </p>
          </div>

          <Link href="/tutorias/postular">
            <Boton variante="contorno">Quiero ser tutor</Boton>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {/* Formulario común enviado por GET, como el resto de los buscadores del
            sitio: el resultado queda en la dirección y se puede compartir. */}
        <form
          method="get"
          action="/tutorias"
          className="border-borde bg-superficie-suave flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-4"
        >
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-texto text-sm font-semibold">
              Buscar
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Nombre o carnet del tutor"
              className={claseCampo}
            />
          </div>

          <div className="flex min-w-56 flex-col gap-1.5">
            <label htmlFor="curso" className="text-texto text-sm font-semibold">
              Curso
            </label>
            <select id="curso" name="curso" defaultValue={idCurso ?? ""} className={claseCampo}>
              <option value="">Todos los cursos</option>
              {cursos.map((curso) => (
                <option key={curso.idCurso} value={curso.idCurso}>
                  {curso.codigo} · {curso.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Boton type="submit" variante="contorno">
              Filtrar
            </Boton>
            {(idCurso || q) && (
              <Link
                href="/tutorias"
                className="text-primario hover:bg-primario-suave inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>

        <p className="text-texto-suave mt-6 text-sm">
          {tutores.length === 0
            ? "Sin tutores"
            : `${tutores.length} ${tutores.length === 1 ? "tutor disponible" : "tutores disponibles"}`}
          {cursoElegido ? ` para ${cursoElegido.codigo}` : ""}
        </p>

        {tutores.length === 0 ? (
          <div className="border-borde bg-superficie-suave mt-6 rounded-[1.25rem] border border-dashed px-6 py-16 text-center">
            <p className="text-texto text-base font-bold">
              {idCurso || q
                ? "Ningún tutor coincide con la búsqueda"
                : "Todavía no hay tutores disponibles"}
            </p>
            <p className="text-texto-suave mx-auto mt-2 max-w-md text-sm leading-relaxed">
              {idCurso || q
                ? "Prueba con otro curso o limpia los filtros para ver a todos."
                : "AEUVG publica aquí a los estudiantes cuya postulación aprueba. Si llevaste bien un curso, puedes postularte tú."}
            </p>
            <Link
              href="/tutorias/postular"
              className="text-primario mt-4 inline-flex text-sm font-bold hover:underline"
            >
              Quiero ser tutor
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tutores.map((tutor) => (
              <TarjetaTutor key={tutor.idTutor} tutor={tutor} />
            ))}
          </div>
        )}
      </section>
    </MarcoSitio>
  );
}
