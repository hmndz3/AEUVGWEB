"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorHora } from "@/components/ui/selector-hora";
import type { MiTurno } from "@/lib/prestamo-batas/consultas-prestamo-batas";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 w-full rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

/**
 * Comprobante de entrada y salida de un turno.
 *
 * El voluntario elige uno de los turnos que atiende, reporta sus horas y sube
 * una foto al entrar y otra al salir: son la prueba de que estuvo en el salón,
 * y sin ellas AEUVG no tiene con qué acreditarle las horas. Enviarlo cierra el
 * turno de ese día, así que el formulario de préstamos deja de estar a la vista.
 */
export function FormularioComprobante({ turnos }: { turnos: MiTurno[] }) {
  const router = useRouter();
  const [idTurno, setIdTurno] = useState<string>(turnos[0]?.idTurno.toString() ?? "");
  const [fecha, setFecha] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [fotoInicio, setFotoInicio] = useState("");
  const [fotoFin, setFotoFin] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  if (turnos.length === 0) {
    return (
      <Alerta tipo="informativo">
        No tienes turnos asignados todavía. Cuando AEUVG te asigne a un turno podrás enviar tus
        comprobantes de horas.
      </Alerta>
    );
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!fecha) {
      setError("Elige la fecha del turno.");
      return;
    }
    if (!horaEntrada || !horaSalida) {
      setError("Indica tu hora de entrada y de salida.");
      return;
    }
    if (!fotoInicio || !fotoFin) {
      setError("Sube la foto de cuando entraste y la de cuando saliste.");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch("/api/prestamo-batas/comprobantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idTurno: Number(idTurno),
          fecha,
          horaEntrada,
          horaSalida,
          fotoInicioUrl: fotoInicio,
          fotoFinUrl: fotoFin,
          comentarioVoluntario: comentario,
        }),
      });

      if (respuesta.ok) {
        setExito(true);
        setFecha("");
        setHoraEntrada("");
        setHoraSalida("");
        setFotoInicio("");
        setFotoFin("");
        setComentario("");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(cuerpo.errores ?? {})[0] ??
          cuerpo.mensaje ??
          "No se pudo enviar el comprobante."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <NotaCamposObligatorios />

      {exito && (
        <Alerta tipo="exito">
          Tu comprobante quedó enviado. AEUVG lo revisará y acreditará tus horas.
        </Alerta>
      )}
      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="turno-comprobante" obligatorio>
          Turno
        </EtiquetaCampo>
        <select
          id="turno-comprobante"
          required
          value={idTurno}
          onChange={(e) => setIdTurno(e.target.value)}
          className={claseCampo}
        >
          {turnos.map((turno) => (
            <option key={turno.idTurno} value={turno.idTurno}>
              {turno.etiquetaDia}, {turno.rango}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo obligatorio>Fecha</EtiquetaCampo>
          <SelectorFecha id="fecha-comprobante" valor={fecha} onCambiar={setFecha} />
        </div>
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="hora-entrada" obligatorio>
            Hora de entrada
          </EtiquetaCampo>
          <SelectorHora id="hora-entrada" valor={horaEntrada} onCambiar={setHoraEntrada} paso={5} />
        </div>
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="hora-salida-comp" obligatorio>
            Hora de salida
          </EtiquetaCampo>
          <SelectorHora
            id="hora-salida-comp"
            valor={horaSalida}
            onCambiar={setHoraSalida}
            paso={5}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-texto text-sm font-semibold">
          Fotos del turno
          <span aria-hidden className="text-error ml-0.5 font-bold">
            *
          </span>
        </legend>
        <p className="text-texto-suave text-sm leading-relaxed">
          Una al entrar al salón y otra al salir. AEUVG las revisa antes de acreditarte las horas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-texto text-sm font-semibold">Foto de entrada</span>
            <CargaImagen
              valor={fotoInicio}
              onCambio={setFotoInicio}
              onError={setError}
              descripcion="Vista previa de la foto de entrada"
              destino="/api/imagenes/subir"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-texto text-sm font-semibold">Foto de salida</span>
            <CargaImagen
              valor={fotoFin}
              onCambio={setFotoFin}
              onError={setError}
              descripcion="Vista previa de la foto de salida"
              destino="/api/imagenes/subir"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="comentario-comprobante">Comentario</EtiquetaCampo>
        <textarea
          id="comentario-comprobante"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Algo que AEUVG deba saber de este turno (opcional)."
          className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      <div>
        <Boton type="submit" cargando={enviando}>
          Enviar y cerrar mi turno
        </Boton>
      </div>
    </form>
  );
}
