"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { BuscadorEstudiante } from "@/components/admin/buscador-estudiante";
import { inicialesDe } from "@/lib/auth/usuario-sesion-cliente";
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

/** Un estudiante ya agregado al registro. */
type Burbuja = {
  carnet: string;
  /** Nombre de su cuenta, o null si ese carnet todavía no tiene una. */
  nombreCuenta: string | null;
};

/** El carnet en la forma en la que se compara y se guarda. */
const normalizar = (carnet: string) => carnet.replace(/\s+/g, "").toUpperCase();

/**
 * Burbuja de un estudiante agregado, con su avatar de iniciales y el botón
 * para quitarlo. Las de los carnets sin cuenta van en ámbar: son las que el
 * registro para varios no admite, porque su nombre no lo pone nadie.
 */
function BurbujaEstudiante({ burbuja, alQuitar }: { burbuja: Burbuja; alQuitar: () => void }) {
  const conCuenta = burbuja.nombreCuenta !== null;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-1 pl-1.5 text-sm ${
        conCuenta ? "bg-turquesa/15 text-[#00695a]" : "bg-ambar/20 text-[#8a5600]"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold ${
          conCuenta ? "bg-turquesa/30" : "bg-ambar/40"
        }`}
      >
        {conCuenta ? inicialesDe(burbuja.nombreCuenta ?? "") : "?"}
      </span>
      <span className="min-w-0 truncate font-semibold">
        {burbuja.nombreCuenta ?? burbuja.carnet}
      </span>
      <span className="font-mono text-xs opacity-70">{burbuja.carnet}</span>
      <button
        type="button"
        onClick={alQuitar}
        aria-label={`Quitar a ${burbuja.nombreCuenta ?? burbuja.carnet}`}
        className="grid size-6 shrink-0 place-items-center rounded-full text-base leading-none transition-colors hover:bg-black/10"
      >
        ×
      </button>
    </span>
  );
}

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
  const [burbujas, setBurbujas] = useState<Burbuja[]>(() =>
    valoresIniciales.carnet
      ? [
          {
            carnet: valoresIniciales.carnet,
            nombreCuenta: valoresIniciales.nombreEstudiante || null,
          },
        ]
      : []
  );
  const [buscado, setBuscado] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = <Clave extends keyof ValoresHoraBeca>(clave: Clave, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  /** Al editar se corrige un registro y su estudiante no cambia. */
  const varios = id === undefined;
  const sinCuenta = burbujas.filter((burbuja) => burbuja.nombreCuenta === null);
  // Un solo estudiante puede no tener cuenta, y entonces hay que escribir su
  // nombre. Con varios eso no es posible, y el servidor los rechaza.
  const pideNombre = burbujas.length === 1 && burbujas[0].nombreCuenta === null;

  const agregar = (carnet: string, nombreCuenta: string | null) => {
    const limpio = normalizar(carnet);
    if (limpio.length === 0) return;

    setBuscado("");
    setBurbujas((previas) =>
      previas.some((burbuja) => burbuja.carnet === limpio)
        ? previas
        : [...previas, { carnet: limpio, nombreCuenta }]
    );
  };

  const quitar = (carnet: string) =>
    setBurbujas((previas) => previas.filter((burbuja) => burbuja.carnet !== carnet));

  /**
   * Un carnet escrito a mano se resuelve contra las cuentas antes de volverse
   * burbuja: así quien captura ve el nombre de la persona a la que le va a
   * registrar horas, que es lo que delata un carnet mal tecleado.
   */
  async function confirmarEscrito(texto: string) {
    const limpio = normalizar(texto);

    try {
      const respuesta = await fetch(`/api/admin/estudiantes?q=${encodeURIComponent(limpio)}`);
      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        estudiantes?: EstudianteSugerido[];
      };
      const cuenta = cuerpo.estudiantes?.find(
        (estudiante) => normalizar(estudiante.carnet) === limpio
      );

      agregar(limpio, cuenta?.nombreCompleto ?? null);
    } catch {
      // El buscador es una ayuda: sin él el carnet se agrega igual, sin nombre.
      agregar(limpio, null);
    }
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const base = "/api/admin/horas-beca";
      const actividad = {
        fechaActividad: valores.fechaActividad,
        horarioApoyo: componerHorario(valores.horaInicio, valores.horaFin),
        descripcionActividad: valores.descripcionActividad,
        cantidadHoras: valores.cantidadHoras,
        observaciones: valores.observaciones,
      };

      // Con más de un estudiante la petición va al registro en lote, que
      // escribe un renglón por carnet en una sola operación.
      const enLote = burbujas.length > 1;
      const destinoPeticion = enLote ? `${base}/lote` : id ? `${base}/${id}` : base;
      const respuesta = await fetch(destinoPeticion, {
        method: id && !enLote ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          enLote
            ? {
                accion: "registrar",
                carnets: burbujas.map((burbuja) => burbuja.carnet).join(","),
                ...actividad,
              }
            : {
                ...actividad,
                carnet: burbujas[0]?.carnet ?? "",
                nombreEstudiante: burbujas[0]?.nombreCuenta ?? valores.nombreEstudiante,
              }
        ),
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

      {/* Los estudiantes se agregan como los destinatarios de un correo: cada
          uno que se elige se vuelve una burbuja y el campo queda listo para el
          siguiente. Una misma actividad la realizan varios, y capturar los
          mismos cinco campos una vez por persona es donde aparecen los errores
          de dedo. */}
      <Campo
        etiqueta={varios ? "Estudiantes" : "Estudiante"}
        obligatorio
        nombre="carnet"
        error={errores.carnet ?? errores.carnets}
        ayuda={
          varios
            ? "Escribe el carnet y elige de la lista, o pulsa Enter para agregarlo tal cual. Puedes agregar los que quieras."
            : "Escribe el carnet y elige de la lista."
        }
      >
        <div className="border-borde bg-superficie focus-within:border-primario focus-within:ring-primario/30 flex flex-wrap items-center gap-2 rounded-2xl border p-2 focus-within:ring-2">
          {burbujas.map((burbuja) => (
            <BurbujaEstudiante
              key={burbuja.carnet}
              burbuja={burbuja}
              alQuitar={() => quitar(burbuja.carnet)}
            />
          ))}

          {(varios || burbujas.length === 0) && (
            <div className="min-w-48 flex-1">
              <BuscadorEstudiante
                id="carnet"
                valor={buscado}
                onCambiar={setBuscado}
                onElegir={(estudiante) => agregar(estudiante.carnet, estudiante.nombreCompleto)}
                onConfirmarTexto={confirmarEscrito}
                mostrarCuenta={false}
                placeholder={burbujas.length === 0 ? "Carnet o nombre" : "Agregar otro"}
                claseEntrada="text-texto w-full bg-transparent px-2 py-1.5 text-sm focus:outline-none"
              />
            </div>
          )}
        </div>
      </Campo>

      {/* Con varios carnets el nombre lo pone cada cuenta; con uno solo que no
          la tiene, hay que escribirlo, que es el caso para el que nació este
          módulo. */}
      {pideNombre && (
        <Campo
          etiqueta="Nombre del estudiante"
          obligatorio
          nombre="nombreEstudiante"
          error={errores.nombreEstudiante}
          ayuda="Este carnet todavía no tiene cuenta, así que su nombre no se puede deducir."
        >
          <input
            id="nombreEstudiante"
            value={valores.nombreEstudiante}
            onChange={(evento) => cambiar("nombreEstudiante", evento.target.value)}
            maxLength={200}
            className={claseCampo}
          />
        </Campo>
      )}

      {burbujas.length > 1 && sinCuenta.length > 0 && (
        <Alerta tipo="error">
          {sinCuenta.map((burbuja) => burbuja.carnet).join(", ")}
          {sinCuenta.length === 1 ? " todavía no tiene cuenta" : " todavía no tienen cuenta"} en la
          plataforma, así que su nombre no se puede deducir. Quítalos y regístralos por separado, o
          carga sus horas desde Excel.
        </Alerta>
      )}

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
        <Boton
          type="submit"
          disabled={burbujas.length === 0 || (burbujas.length > 1 && sinCuenta.length > 0)}
          cargando={guardando}
        >
          {id
            ? "Guardar cambios"
            : burbujas.length > 1
              ? `Registrar horas para ${burbujas.length} estudiantes`
              : "Registrar horas"}
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
