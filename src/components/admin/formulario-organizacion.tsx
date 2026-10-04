"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { etiquetasDeCampo, type TipoOrganizacion } from "@/validators/organizacion-admin";

export type ValoresOrganizacion = {
  nombre: string;
  descripcion: string;
  mision: string;
  vision: string;
  actividades: string;
  correo: string;
  informacionContacto: string;
  imagenUrl: string;
};

export const VALORES_ORGANIZACION_VACIOS: ValoresOrganizacion = {
  nombre: "",
  descripcion: "",
  mision: "",
  vision: "",
  actividades: "",
  correo: "",
  informacionContacto: "",
  imagenUrl: "",
};

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

function Campo({
  etiqueta,
  nombre,
  error,
  ayuda,
  children,
}: {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nombre} className="text-texto text-sm font-semibold">
        {etiqueta}
      </label>
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
function resumenDeErrores(errores: Record<string, string>, tipo: TipoOrganizacion): string {
  const etiquetas = etiquetasDeCampo(tipo);
  const campos = Object.keys(errores)
    .map((campo) => etiquetas[campo] ?? campo)
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
 * Formulario de creación y edición de asociaciones y clubes.
 *
 * Es un solo formulario para las dos fichas: comparten la mayoría de los campos
 * y solo cambian los propios de cada una, que se muestran según el tipo. Los
 * campos que el tipo no usa se envían vacíos y el esquema los ignora.
 */
export function FormularioOrganizacion({
  tipo,
  id,
  valoresIniciales,
}: {
  tipo: TipoOrganizacion;
  id?: number;
  valoresIniciales: ValoresOrganizacion;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const esAsociacion = tipo === "asociaciones";
  const singular = esAsociacion ? "asociación" : "club";

  const cambiar = <Clave extends keyof ValoresOrganizacion>(
    clave: Clave,
    valor: ValoresOrganizacion[Clave]
  ) => setValores((previos) => ({ ...previos, [clave]: valor }));

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const base = `/api/admin/organizaciones/${tipo}`;
      const respuesta = await fetch(id ? `${base}/${id}` : base, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (respuesta.ok) {
        router.push(`/admin/${tipo}`);
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
        setErrores(cuerpo.errores);
        setGeneral(resumenDeErrores(cuerpo.errores, tipo));
        enfocarPrimerError(cuerpo.errores);
        return;
      }

      setGeneral(cuerpo.mensaje ?? `No se pudo guardar la ${singular}. Intenta de nuevo.`);
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    // noValidate: la validación nativa del navegador bloqueaba el envío sin
    // llegar al servidor y su único aviso era un globo sobre el campo. Valida el
    // esquema, con mensajes propios.
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <Campo etiqueta="Nombre" nombre="nombre" error={errores.nombre}>
        <input
          id="nombre"
          value={valores.nombre}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          maxLength={160}
          className={claseCampo}
        />
      </Campo>

      <Campo
        etiqueta="Descripción"
        nombre="descripcion"
        error={errores.descripcion}
        ayuda="Es el texto que encabeza la página y el que resume la tarjeta del listado."
      >
        <textarea
          id="descripcion"
          value={valores.descripcion}
          onChange={(evento) => cambiar("descripcion", evento.target.value)}
          rows={5}
          maxLength={5000}
          className={claseCampo}
        />
      </Campo>

      {esAsociacion ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Campo etiqueta="Misión" nombre="mision" error={errores.mision}>
            <textarea
              id="mision"
              value={valores.mision}
              onChange={(evento) => cambiar("mision", evento.target.value)}
              rows={4}
              maxLength={2000}
              className={claseCampo}
            />
          </Campo>

          <Campo etiqueta="Visión" nombre="vision" error={errores.vision}>
            <textarea
              id="vision"
              value={valores.vision}
              onChange={(evento) => cambiar("vision", evento.target.value)}
              rows={4}
              maxLength={2000}
              className={claseCampo}
            />
          </Campo>
        </div>
      ) : (
        <Campo
          etiqueta="Actividades"
          nombre="actividades"
          error={errores.actividades}
          ayuda="Qué hace el club habitualmente: reuniones, ensayos, competencias."
        >
          <textarea
            id="actividades"
            value={valores.actividades}
            onChange={(evento) => cambiar("actividades", evento.target.value)}
            rows={4}
            maxLength={2000}
            className={claseCampo}
          />
        </Campo>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Campo
          etiqueta="Correo"
          nombre="correo"
          error={errores.correo}
          ayuda="Opcional. Se muestra como enlace en el bloque de contacto."
        >
          <input
            id="correo"
            type="email"
            value={valores.correo}
            onChange={(evento) => cambiar("correo", evento.target.value)}
            maxLength={254}
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Información de contacto"
          nombre="informacionContacto"
          error={errores.informacionContacto}
          ayuda="Opcional. Por ejemplo la oficina o el horario de atención."
        >
          <textarea
            id="informacionContacto"
            value={valores.informacionContacto}
            onChange={(evento) => cambiar("informacionContacto", evento.target.value)}
            rows={3}
            maxLength={2000}
            className={claseCampo}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Imagen o logotipo"
        nombre="imagenUrl"
        error={errores.imagenUrl}
        ayuda="Opcional. Sin imagen se presentan las iniciales del nombre."
      >
        <input
          id="imagenUrl"
          value={valores.imagenUrl}
          onChange={(evento) => cambiar("imagenUrl", evento.target.value)}
          maxLength={500}
          placeholder="https://ejemplo.com/logo.png"
          className={claseCampo}
        />
        <div className="mt-2">
          <CargaImagen
            valor={valores.imagenUrl}
            descripcion={`Vista previa del logotipo de la ${singular}`}
            onCambio={(url) => cambiar("imagenUrl", url)}
            onError={(mensaje) => setGeneral(mensaje)}
          />
        </div>
      </Campo>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando}>
          {id ? "Guardar cambios" : `Crear ${singular}`}
        </Boton>
        <Boton
          type="button"
          variante="contorno"
          onClick={() => router.push(`/admin/${tipo}`)}
          disabled={guardando}
        >
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
