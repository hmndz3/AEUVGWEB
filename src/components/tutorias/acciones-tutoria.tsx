"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import type { TutoriaVista } from "@/lib/tutorias/consultas-tutorias";

const CONFIRMAR_CANCELAR =
  "La tutoría se cancela para los dos y no se puede volver a programar; habría que agendar otra. ¿Continuar?";

const claseTexto =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/** La tutoría ya empezó, que es desde cuándo tiene sentido probar que se dio. */
function yaEmpezo(tutoria: TutoriaVista): boolean {
  return tutoria.fechaInicio.getTime() <= Date.now();
}

/**
 * Lo que cada parte puede hacer con una tutoría.
 *
 * El tutor responde primero —acepta o rechaza—, y si la acepta sube una prueba
 * del inicio y otra del final para dar la sesión por impartida. El estudiante
 * confirma por su lado con una foto de que el tutor se presentó. Con eso AEUVG
 * revisa y acepta las horas beca del tutor; por eso hacen falta las tres
 * pruebas y no basta con que el tutor diga que la dio.
 */
export function AccionesTutoria({
  tutoria,
  comoTutor,
}: {
  tutoria: TutoriaVista;
  comoTutor: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [comentario, setComentario] = useState("");
  const [pruebaInicio, setPruebaInicio] = useState("");
  const [pruebaFin, setPruebaFin] = useState("");
  const [pruebaEstudiante, setPruebaEstudiante] = useState("");

  async function enviar(url: string, cuerpo: unknown, metodo = "POST") {
    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      if (respuesta.ok) {
        router.refresh();
        return true;
      }

      const datos = (await respuesta.json().catch(() => ({}))) as {
        mensaje?: string;
        errores?: Record<string, string>;
      };
      setError(
        Object.values(datos.errores ?? {})[0] ??
          datos.mensaje ??
          "No se pudo actualizar la tutoría."
      );
      return false;
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
      return false;
    } finally {
      setTrabajando(false);
    }
  }

  const enPie = tutoria.estado === "PROGRAMADA" || tutoria.estado === "ACEPTADA";

  const puedeResponder = comoTutor && tutoria.estado === "PROGRAMADA";
  const puedeMarcar =
    comoTutor &&
    tutoria.estado === "ACEPTADA" &&
    tutoria.estadoHoras !== "PENDIENTE" &&
    tutoria.estadoHoras !== "ACEPTADAS";
  const puedeConfirmar =
    !comoTutor &&
    (tutoria.estado === "ACEPTADA" || tutoria.estado === "COMPLETADA") &&
    tutoria.pruebaEstudianteUrl === null;

  return (
    <div className="border-borde flex flex-col gap-3 border-t pt-3">
      {error && <Alerta tipo="error">{error}</Alerta>}

      <EstadoDeLasPruebas tutoria={tutoria} comoTutor={comoTutor} />

      {puedeResponder && !rechazando && (
        <div className="flex flex-wrap items-center gap-2">
          <Boton
            type="button"
            tamano="sm"
            cargando={trabajando}
            onClick={() =>
              enviar(`/api/tutorias/${tutoria.idTutoria}/respuesta`, {
                decision: "aceptar",
                comentario: "",
              })
            }
          >
            Aceptar tutoría
          </Boton>
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            disabled={trabajando}
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </Boton>
        </div>
      )}

      {puedeResponder && rechazando && (
        <div className="flex flex-col gap-2">
          <EtiquetaCampo htmlFor={`motivo-${tutoria.idTutoria}`}>
            Motivo (opcional, lo verá el estudiante)
          </EtiquetaCampo>
          <textarea
            id={`motivo-${tutoria.idTutoria}`}
            value={comentario}
            onChange={(evento) => setComentario(evento.target.value)}
            rows={2}
            maxLength={1000}
            className={claseTexto}
          />
          <div className="flex flex-wrap gap-2">
            <Boton
              type="button"
              tamano="sm"
              cargando={trabajando}
              onClick={() =>
                enviar(`/api/tutorias/${tutoria.idTutoria}/respuesta`, {
                  decision: "rechazar",
                  comentario,
                })
              }
            >
              Rechazar tutoría
            </Boton>
            <Boton
              type="button"
              variante="contorno"
              tamano="sm"
              disabled={trabajando}
              onClick={() => setRechazando(false)}
            >
              Volver
            </Boton>
          </div>
        </div>
      )}

      {puedeMarcar &&
        (yaEmpezo(tutoria) ? (
          <div className="flex flex-col gap-3">
            <p className="text-texto-suave text-sm">
              Para que AEUVG te acredite las horas, sube una prueba del inicio y otra del final de
              la tutoría.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <CampoPrueba
                etiqueta="Prueba del inicio"
                valor={pruebaInicio}
                onCambio={setPruebaInicio}
                onError={setError}
              />
              <CampoPrueba
                etiqueta="Prueba del final"
                valor={pruebaFin}
                onCambio={setPruebaFin}
                onError={setError}
              />
            </div>

            <div>
              <Boton
                type="button"
                tamano="sm"
                cargando={trabajando}
                disabled={pruebaInicio === "" || pruebaFin === ""}
                onClick={() =>
                  enviar(`/api/tutorias/${tutoria.idTutoria}/pruebas`, {
                    pruebaInicioUrl: pruebaInicio,
                    pruebaFinUrl: pruebaFin,
                  })
                }
              >
                Marcar como dada
              </Boton>
            </div>
          </div>
        ) : (
          <p className="text-texto-suave text-sm">
            Cuando des la tutoría podrás subir aquí las pruebas del inicio y del final.
          </p>
        ))}

      {puedeConfirmar &&
        (yaEmpezo(tutoria) ? (
          <div className="flex flex-col gap-3">
            <p className="text-texto-suave text-sm">
              Confirma que el tutor se presentó subiendo una foto de la tutoría. Es lo que respalda
              sus horas beca.
            </p>

            <div className="sm:max-w-xs">
              <CampoPrueba
                etiqueta="Foto de la tutoría"
                valor={pruebaEstudiante}
                onCambio={setPruebaEstudiante}
                onError={setError}
              />
            </div>

            <div>
              <Boton
                type="button"
                tamano="sm"
                cargando={trabajando}
                disabled={pruebaEstudiante === ""}
                onClick={() =>
                  enviar(`/api/tutorias/${tutoria.idTutoria}/confirmacion`, {
                    pruebaUrl: pruebaEstudiante,
                  })
                }
              >
                Confirmar que se dio
              </Boton>
            </div>
          </div>
        ) : (
          <p className="text-texto-suave text-sm">
            Cuando recibas la tutoría podrás confirmarla aquí con una foto.
          </p>
        ))}

      {enPie && (
        <div>
          <Boton
            type="button"
            variante="contorno"
            tamano="sm"
            disabled={trabajando}
            onClick={() => {
              if (window.confirm(CONFIRMAR_CANCELAR)) {
                void enviar(`/api/tutorias/${tutoria.idTutoria}`, { accion: "cancelar" }, "PATCH");
              }
            }}
          >
            Cancelar tutoría
          </Boton>
        </div>
      )}
    </div>
  );
}

/** Una prueba: se sube y queda su vista previa. */
function CampoPrueba({
  etiqueta,
  valor,
  onCambio,
  onError,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (url: string) => void;
  onError: (mensaje: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-texto text-sm font-semibold">{etiqueta}</span>
      <CargaImagen
        valor={valor}
        onCambio={onCambio}
        onError={onError}
        descripcion={`Vista previa de la ${etiqueta.toLocaleLowerCase("es")}`}
        destino="/api/imagenes/subir"
        etiqueta="Subir imagen"
      />
    </div>
  );
}

/** En qué va la validación, dicho con lo que cada parte necesita saber. */
function EstadoDeLasPruebas({ tutoria, comoTutor }: { tutoria: TutoriaVista; comoTutor: boolean }) {
  if (tutoria.estado === "RECHAZADA") {
    return (
      <p className="text-texto-suave text-sm">
        {comoTutor ? "Rechazaste esta tutoría." : "El tutor no pudo dar esta tutoría."}
        {tutoria.comentarioTutor && ` ${tutoria.comentarioTutor}`}
      </p>
    );
  }

  if (tutoria.estadoHoras === "PENDIENTE") {
    return (
      <p className="text-texto-suave text-sm">
        {comoTutor
          ? "Enviaste las pruebas. AEUVG revisará tus horas."
          : "El tutor ya envió sus pruebas."}
        {!comoTutor && tutoria.pruebaEstudianteUrl === null && " Falta tu confirmación."}
      </p>
    );
  }

  if (tutoria.estadoHoras === "ACEPTADAS" && comoTutor) {
    return (
      <p className="text-texto-suave text-sm">
        AEUVG aceptó estas horas: ya están en tu módulo de horas beca, pendientes de acreditar.
      </p>
    );
  }

  if (tutoria.estadoHoras === "RECHAZADAS" && comoTutor) {
    return (
      <p className="text-texto-suave text-sm">
        AEUVG no aceptó estas horas.
        {tutoria.comentarioRevisionHoras && ` ${tutoria.comentarioRevisionHoras}`} Puedes volver a
        subir las pruebas.
      </p>
    );
  }

  if (!comoTutor && tutoria.pruebaEstudianteUrl !== null) {
    return <p className="text-texto-suave text-sm">Ya confirmaste esta tutoría. Gracias.</p>;
  }

  return null;
}
