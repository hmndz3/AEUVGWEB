"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import type { CursoDisponible } from "@/lib/tutorias/consultas-tutorias";
import {
  ETIQUETAS_CAMPO_TUTORIA,
  MAXIMO_CURSOS_POSTULACION,
  NOTA_MINIMA_TUTOR,
} from "@/validators/tutoria";

/** Un curso de la postulación mientras se llena el formulario. */
type CursoElegido = { idCurso: string; notaObtenida: string; comprobanteUrl: string };

const CURSO_VACIO: CursoElegido = { idCurso: "", notaObtenida: "", comprobanteUrl: "" };

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/** Resumen de los campos que impiden enviar, para mostrarlo arriba. */
function resumenDeErrores(errores: Record<string, string>): string {
  if (errores.general) return errores.general;

  const campos = Object.keys(errores)
    .map((campo) => ETIQUETAS_CAMPO_TUTORIA[campo.split(".").pop() ?? campo] ?? campo)
    .filter((campo, indice, lista) => lista.indexOf(campo) === indice);

  return `Revisa lo siguiente antes de enviar: ${campos.join(", ")}.`;
}

/**
 * Postulación para ser tutor.
 *
 * Se pide un curso a la vez, cada uno con la nota que obtuvo y el comprobante
 * que la respalda. La nota va por curso y no como promedio porque quien sacó
 * cien en cálculo puede no estar en condiciones de dar química, y el
 * comprobante existe porque la nota la declara quien se postula: sin algo que
 * la respalde, AEUVG no tendría con qué contrastarla al revisar.
 */
export function FormularioPostulacion({ cursos }: { cursos: CursoDisponible[] }) {
  const router = useRouter();
  const [elegidos, setElegidos] = useState<CursoElegido[]>([{ ...CURSO_VACIO }]);
  const [comentario, setComentario] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiarCurso = (indice: number, cambios: Partial<CursoElegido>) =>
    setElegidos((previos) =>
      previos.map((curso, posicion) => (posicion === indice ? { ...curso, ...cambios } : curso))
    );

  const quitarCurso = (indice: number) =>
    setElegidos((previos) => previos.filter((_, posicion) => posicion !== indice));

  // Un curso ya elegido no vuelve a ofrecerse: la postulación lo rechazaría por
  // repetido y es más claro no dejar llegar hasta ahí.
  const disponiblesPara = (indice: number) =>
    cursos.filter(
      (curso) =>
        !elegidos.some(
          (elegido, posicion) => posicion !== indice && Number(elegido.idCurso) === curso.idCurso
        )
    );

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErrores({});
    setGeneral(null);

    try {
      const respuesta = await fetch("/api/tutorias/postulaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentarioSolicitante: comentario,
          cursos: elegidos.map((curso) => ({
            idCurso: curso.idCurso,
            notaObtenida: curso.notaObtenida,
            comprobanteUrl: curso.comprobanteUrl,
          })),
        }),
      });

      if (respuesta.ok) {
        router.push("/perfil#mis-tutorias");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
        setErrores(cuerpo.errores);
        setGeneral(resumenDeErrores(cuerpo.errores));
        return;
      }

      setGeneral(cuerpo.mensaje ?? "No se pudo enviar la postulación. Intenta de nuevo.");
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  }

  const completo = elegidos.every(
    (curso) => curso.idCurso !== "" && curso.notaObtenida !== "" && curso.comprobanteUrl !== ""
  );

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <NotaCamposObligatorios />

      <div className="flex flex-col gap-4">
        {elegidos.map((curso, indice) => (
          <div
            key={indice}
            className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-texto text-sm font-bold">Curso {indice + 1}</p>
              {elegidos.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarCurso(indice)}
                  className="text-error text-sm font-bold hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <EtiquetaCampo htmlFor={`curso-${indice}`} obligatorio>
                  Curso
                </EtiquetaCampo>
                <select
                  id={`curso-${indice}`}
                  value={curso.idCurso}
                  onChange={(evento) => cambiarCurso(indice, { idCurso: evento.target.value })}
                  className={claseCampo}
                >
                  <option value="">Elige un curso</option>
                  {disponiblesPara(indice).map((opcion) => (
                    <option key={opcion.idCurso} value={opcion.idCurso}>
                      {opcion.codigo} · {opcion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <EtiquetaCampo htmlFor={`nota-${indice}`} obligatorio>
                  Nota obtenida
                </EtiquetaCampo>
                <input
                  id={`nota-${indice}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={curso.notaObtenida}
                  onChange={(evento) => cambiarCurso(indice, { notaObtenida: evento.target.value })}
                  className={claseCampo}
                />
                <p className="text-texto-suave text-xs">Mínimo {NOTA_MINIMA_TUTOR}.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo obligatorio>Comprobante de la nota</EtiquetaCampo>
              <CargaImagen
                valor={curso.comprobanteUrl}
                onCambio={(url) => cambiarCurso(indice, { comprobanteUrl: url })}
                onError={(mensaje) => setGeneral(mensaje)}
                destino="/api/imagenes/subir"
                etiqueta="Subir comprobante"
                descripcion={`Comprobante de la nota del curso ${indice + 1}`}
              />
              <p className="text-texto-suave text-xs">
                Una captura de tu historial académico donde se vea el curso y la nota.
              </p>
            </div>
          </div>
        ))}
      </div>

      {errores.cursos && (
        <p role="alert" className="text-error text-sm font-medium">
          {errores.cursos}
        </p>
      )}

      {elegidos.length < MAXIMO_CURSOS_POSTULACION && elegidos.length < cursos.length && (
        <div>
          <Boton
            type="button"
            variante="contorno"
            onClick={() => setElegidos((previos) => [...previos, { ...CURSO_VACIO }])}
          >
            Agregar otro curso
          </Boton>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="comentario">Algo que quieras contarle a AEUVG</EtiquetaCampo>
        <textarea
          id="comentario"
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          rows={3}
          maxLength={1000}
          className={claseCampo}
        />
        <p className="text-texto-suave text-xs">
          Opcional. Por ejemplo, si ya has dado tutorías antes o en qué horarios te acomoda.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" disabled={!completo} cargando={enviando}>
          Enviar postulación
        </Boton>
        <p className="text-texto-suave text-xs">
          AEUVG la revisa y te avisa. Mientras tanto puedes seguir usando la plataforma igual.
        </p>
      </div>
    </form>
  );
}
