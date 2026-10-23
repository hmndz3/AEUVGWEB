"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { BuscadorEstudiante } from "@/components/admin/buscador-estudiante";
import type { EstudianteSugerido } from "@/lib/horas-beca/consultas-estudiantes";
import { componerHorario } from "@/lib/horas-beca/formato-horas";
import { MAXIMO_HORAS_POR_REGISTRO } from "@/lib/horas-beca/servicio-horas-beca";
import { ETIQUETAS_CAMPO_HORA_BECA } from "@/validators/hora-beca-admin";

export type ValoresHoraBeca = {
  carnet: string;
  nombreEstudiante: string;
  fechaActividad: string;
  /** El horario se captura en dos selectores y se envía como "HH:MM-HH:MM". */
  horaInicio: string;
  horaFin: string;
  descripcionActividad: string;
  cantidadHoras: string;
  observaciones: string;
};

export const VALORES_HORA_BECA_VACIOS: ValoresHoraBeca = {
  carnet: "",
  nombreEstudiante: "",
  fechaActividad: "",
  horaInicio: "",
  horaFin: "",
  descripcionActividad: "",
  cantidadHoras: "",
  observaciones: "",
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
  /** Reparto de columnas cuando el campo necesita más de una. */
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
  const campos = Object.keys(errores)
    .map((campo) => ETIQUETAS_CAMPO_HORA_BECA[campo] ?? campo)
    .filter((campo, indice, lista) => lista.indexOf(campo) === indice);

  if (campos.length === 1) return `Revisa el campo ${campos[0]}: ${Object.values(errores)[0]}`;

  return `Revisa los siguientes campos antes de guardar: ${campos.join(", ")}.`;
}

/** Lleva la vista al primer campo con error y le devuelve el foco. */
function enfocarPrimerError(errores: Record<string, string>) {
  const campo = Object.keys(errores)[0];
  const elemento = campo ? document.getElementById(campo) : null;

  if (elemento) {
    elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    if (elemento instanceof HTMLElement) elemento.focus({ preventScroll: true });
  }
}

/**
 * Formulario de registro de horas beca.
 *
 * El estudiante se identifica por carnet y no por un selector de cuentas: AEUVG
 * carga las horas de una hoja en la que buena parte de los carnets todavía no
 * tiene cuenta, y un selector solo podría ofrecer a quienes ya se registraron.
 * El nombre se pide junto al carnet por la misma razón; cuando la cuenta existe,
 * el servicio guarda el nombre verificado de la cuenta en lugar del escrito.
 */
export function FormularioHoraBeca({
  id,
  valoresIniciales,
  destino,
}: {
  id?: number;
  valoresIniciales: ValoresHoraBeca;
  /** Listado al que se vuelve tras guardar, con los filtros que traía. */
  destino: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = <Clave extends keyof ValoresHoraBeca>(clave: Clave, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  /**
   * Al elegir un estudiante del buscador se completa el nombre, que es el único
   * dato que el formulario puede deducir. Se escribe el de la cuenta porque es
   * el verificado, y es además el que el servicio acabará guardando.
   */
  const elegirEstudiante = (estudiante: EstudianteSugerido) =>
    setValores((previos) => ({
      ...previos,
      carnet: estudiante.carnet,
      nombreEstudiante: estudiante.nombreCompleto,
    }));

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const base = "/api/admin/horas-beca";
      const respuesta = await fetch(id ? `${base}/${id}` : base, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...valores,
          horarioApoyo: componerHorario(valores.horaInicio, valores.horaFin),
        }),
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

      setGeneral(cuerpo.mensaje ?? "No se pudo guardar el registro. Intenta de nuevo.");
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    // noValidate: la validación del navegador bloqueaba el envío sin llegar al
    // servidor y su único aviso era un globo sobre el campo. Valida el esquema.
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <NotaCamposObligatorios />

      <div className="grid gap-5 md:grid-cols-2">
        <Campo
          etiqueta="Carnet"
          obligatorio
          nombre="carnet"
          error={errores.carnet}
          ayuda="Escribe el carnet y elige de la lista si ya tiene cuenta. Si no aparece, escríbelo igual."
        >
          <BuscadorEstudiante
            id="carnet"
            valor={valores.carnet}
            onCambiar={(carnet) => cambiar("carnet", carnet)}
            onElegir={elegirEstudiante}
          />
        </Campo>

        <Campo
          etiqueta="Nombre del estudiante"
          obligatorio
          nombre="nombreEstudiante"
          error={errores.nombreEstudiante}
          ayuda="Si el carnet ya tiene cuenta, se conserva el nombre registrado en ella."
        >
          <input
            id="nombreEstudiante"
            value={valores.nombreEstudiante}
            onChange={(evento) => cambiar("nombreEstudiante", evento.target.value)}
            maxLength={200}
            className={claseCampo}
          />
        </Campo>
      </div>

      {/* Cuatro columnas y no tres: el horario lleva dos relojes y, con el mismo
          ancho que un campo simple, se apretaban hasta montarse sobre la
          cantidad de horas. Las ayudas se alinean arriba para que una de dos
          líneas no empuje a sus vecinas. */}
      <div className="grid items-start gap-5 md:grid-cols-4">
        <Campo
          etiqueta="Fecha de la actividad"
          obligatorio
          nombre="fechaActividad"
          error={errores.fechaActividad}
        >
          <input
            id="fechaActividad"
            type="date"
            value={valores.fechaActividad}
            onChange={(evento) => cambiar("fechaActividad", evento.target.value)}
            className={claseCampo}
          />
        </Campo>

        {/* Dos selectores de hora en vez de texto libre: AEUVG capturaba el
            horario a mano y cada quien lo escribía distinto, lo que impedía
            comparar turnos. El campo de inicio lleva el id del error para que
            el resumen del formulario lo enfoque. */}
        <Campo
          etiqueta="Horario de apoyo"
          obligatorio
          nombre="horarioApoyo"
          error={errores.horarioApoyo}
          ayuda="De qué hora a qué hora apoyó."
          clase="md:col-span-2"
        >
          <div className="flex items-center gap-2">
            <input
              id="horarioApoyo"
              type="time"
              step={300}
              aria-label="Hora de inicio del apoyo"
              value={valores.horaInicio}
              onChange={(evento) => cambiar("horaInicio", evento.target.value)}
              className={`${claseCampo} min-w-0 flex-1`}
            />
            <span className="text-texto-suave shrink-0 text-sm">a</span>
            <input
              id="horaFin"
              type="time"
              step={300}
              aria-label="Hora de fin del apoyo"
              value={valores.horaFin}
              onChange={(evento) => cambiar("horaFin", evento.target.value)}
              className={`${claseCampo} min-w-0 flex-1`}
            />
          </div>
        </Campo>

        <Campo
          etiqueta="Cantidad de horas"
          obligatorio
          nombre="cantidadHoras"
          error={errores.cantidadHoras}
          ayuda={`Hasta ${MAXIMO_HORAS_POR_REGISTRO} horas, con dos decimales.`}
        >
          <input
            id="cantidadHoras"
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0.25"
            max={MAXIMO_HORAS_POR_REGISTRO}
            value={valores.cantidadHoras}
            onChange={(evento) => cambiar("cantidadHoras", evento.target.value)}
            className={claseCampo}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Actividad"
        obligatorio
        nombre="descripcionActividad"
        error={errores.descripcionActividad}
        ayuda="En qué apoyó el estudiante. Es lo que verá en su historial de horas."
      >
        <textarea
          id="descripcionActividad"
          value={valores.descripcionActividad}
          onChange={(evento) => cambiar("descripcionActividad", evento.target.value)}
          rows={3}
          maxLength={1000}
          className={claseCampo}
        />
      </Campo>

      <Campo
        etiqueta="Observaciones"
        nombre="observaciones"
        error={errores.observaciones}
        ayuda="Opcional. Notas internas de AEUVG sobre el registro."
      >
        <textarea
          id="observaciones"
          value={valores.observaciones}
          onChange={(evento) => cambiar("observaciones", evento.target.value)}
          rows={2}
          maxLength={1000}
          className={claseCampo}
        />
      </Campo>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando}>
          {id ? "Guardar cambios" : "Registrar horas"}
        </Boton>
      </div>

      {!id && (
        <p className="text-texto-suave text-xs leading-relaxed">
          El registro se guarda como pendiente. La acreditación se aplica después desde el listado,
          de forma individual o en lote.
        </p>
      )}
    </form>
  );
}
