"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import {
  ETIQUETAS_CAMPO_OPORTUNIDAD,
  MAXIMO_PERSONAS_OPORTUNIDAD,
} from "@/validators/oportunidad-admin";

export type ValoresOportunidad = {
  nombre: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  cantidadPersonas: string;
  informacionAdicional: string;
};

export const VALORES_OPORTUNIDAD_VACIOS: ValoresOportunidad = {
  nombre: "",
  descripcion: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  lugar: "",
  cantidadPersonas: "",
  informacionAdicional: "",
};

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

function Campo({
  etiqueta,
  nombre,
  error,
  ayuda,
  clase,
  obligatorio = false,
  children,
}: {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  clase?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${clase ?? ""}`}>
      <EtiquetaCampo htmlFor={nombre} obligatorio={obligatorio}>
        {etiqueta}
      </EtiquetaCampo>
      {children}
      {ayuda && !error && <p className="text-texto-suave text-xs">{ayuda}</p>}
      {error && (
        <p role="alert" className="text-error text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

/** Resumen de los campos que impiden guardar, para mostrarlo arriba del formulario. */
function resumenDeErrores(errores: Record<string, string>): string {
  if (errores.general) return errores.general;

  const campos = Object.keys(errores)
    .map((campo) => ETIQUETAS_CAMPO_OPORTUNIDAD[campo] ?? campo)
    .filter((campo, indice, lista) => lista.indexOf(campo) === indice);

  if (campos.length === 1) return `Revisa el campo ${campos[0]}: ${Object.values(errores)[0]}`;

  return `Revisa los siguientes campos antes de guardar: ${campos.join(", ")}.`;
}

/** Lleva la vista al primer campo con error y le devuelve el foco. */
function enfocarPrimerError(errores: Record<string, string>) {
  const campo = Object.keys(errores).find((clave) => clave !== "general");
  const elemento = campo ? document.getElementById(campo) : null;

  if (elemento instanceof HTMLElement) {
    elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    elemento.focus({ preventScroll: true });
  }
}

/**
 * Formulario de una convocatoria para realizar horas beca.
 *
 * El estado no se edita aquí: una convocatoria nace como borrador y se publica,
 * cierra o cancela desde el listado, con su propia acción. Así corregir una
 * falta de ortografía no puede publicar lo que todavía se estaba preparando.
 *
 * El horario se captura con dos campos de hora y no a mano, igual que en el
 * registro de horas: es lo que AEUVG pidió en la revisión del Sprint 4.
 */
export function FormularioOportunidad({
  id,
  valoresIniciales,
  destino,
}: {
  id?: number;
  valoresIniciales: ValoresOportunidad;
  destino: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = <Clave extends keyof ValoresOportunidad>(clave: Clave, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const base = "/api/admin/horas-beca/oportunidades";
      const respuesta = await fetch(id ? `${base}/${id}` : base, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (respuesta.ok) {
        router.push(destino);
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
        enfocarPrimerError(cuerpo.errores);
        return;
      }

      setGeneral(cuerpo.mensaje ?? "No se pudo guardar la convocatoria. Intenta de nuevo.");
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    // noValidate por el mismo motivo que el resto de los formularios del panel:
    // la validación del navegador bloquea el envío con un globo sobre el campo
    // y nunca llega al esquema, que es el que da los mensajes buenos.
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <NotaCamposObligatorios />

      <div className="grid gap-5 md:grid-cols-4">
        <Campo
          etiqueta="Actividad"
          obligatorio
          nombre="nombre"
          error={errores.nombre}
          clase="md:col-span-4"
          ayuda="Cómo se llamará la convocatoria en el sitio."
        >
          <input
            id="nombre"
            value={valores.nombre}
            onChange={(evento) => cambiar("nombre", evento.target.value)}
            maxLength={200}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Descripción"
          obligatorio
          nombre="descripcion"
          error={errores.descripcion}
          clase="md:col-span-4"
          ayuda="En qué consiste el apoyo y qué se espera de quien se presente."
        >
          <textarea
            id="descripcion"
            value={valores.descripcion}
            onChange={(evento) => cambiar("descripcion", evento.target.value)}
            rows={4}
            maxLength={2000}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo etiqueta="Fecha" obligatorio nombre="fecha" error={errores.fecha}>
          <input
            id="fecha"
            type="date"
            value={valores.fecha}
            onChange={(evento) => cambiar("fecha", evento.target.value)}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Horario"
          obligatorio
          nombre="horaInicio"
          error={errores.horaInicio ?? errores.horaFin}
          clase="md:col-span-2"
          ayuda="Hora de inicio y hora de fin del apoyo."
        >
          <div className="flex items-start gap-2">
            <input
              id="horaInicio"
              type="time"
              value={valores.horaInicio}
              onChange={(evento) => cambiar("horaInicio", evento.target.value)}
              aria-label="Hora de inicio"
              required
              className={`${claseCampo} min-w-0 flex-1`}
            />
            <span className="text-texto-suave pt-3 text-sm">a</span>
            <input
              id="horaFin"
              type="time"
              value={valores.horaFin}
              onChange={(evento) => cambiar("horaFin", evento.target.value)}
              aria-label="Hora de fin"
              required
              className={`${claseCampo} min-w-0 flex-1`}
            />
          </div>
        </Campo>

        <Campo
          etiqueta="Personas"
          obligatorio
          nombre="cantidadPersonas"
          error={errores.cantidadPersonas}
          ayuda="Cuánta gente se necesita."
        >
          <input
            id="cantidadPersonas"
            type="number"
            min={1}
            max={MAXIMO_PERSONAS_OPORTUNIDAD}
            step={1}
            value={valores.cantidadPersonas}
            onChange={(evento) => cambiar("cantidadPersonas", evento.target.value)}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Lugar"
          obligatorio
          nombre="lugar"
          error={errores.lugar}
          clase="md:col-span-4"
          ayuda="Dónde se presenta quien vaya a apoyar."
        >
          <input
            id="lugar"
            value={valores.lugar}
            onChange={(evento) => cambiar("lugar", evento.target.value)}
            maxLength={255}
            required
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Información adicional"
          nombre="informacionAdicional"
          error={errores.informacionAdicional}
          clase="md:col-span-4"
          ayuda="Opcional: qué llevar, a quién buscar, cualquier requisito."
        >
          <textarea
            id="informacionAdicional"
            value={valores.informacionAdicional}
            onChange={(evento) => cambiar("informacionAdicional", evento.target.value)}
            rows={3}
            maxLength={2000}
            className={claseCampo}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" cargando={guardando}>
          {id ? "Guardar cambios" : "Crear convocatoria"}
        </Boton>
        <Boton type="button" variante="contorno" onClick={() => router.push(destino)}>
          Cancelar
        </Boton>
      </div>

      {!id && (
        <p className="text-texto-suave text-xs">
          La convocatoria se crea como borrador. Se publica desde el listado, cuando esté lista.
        </p>
      )}
    </form>
  );
}
