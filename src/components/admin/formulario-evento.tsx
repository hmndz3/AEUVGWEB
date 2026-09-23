"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import type { CategoriaResumen, OrganizadoresDisponibles } from "@/lib/eventos/consultas-eventos";
import { desdeCampoFechaHora } from "@/lib/eventos/formato-fechas";
import { ETIQUETAS_TIPO_ACTIVIDAD, TIPOS_ACTIVIDAD } from "@/validators/eventos";

export type ValoresEvento = {
  nombre: string;
  descripcion: string;
  idCategoriaEvento: string;
  tipoActividad: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion: string;
  cupo: string;
  informacionAdicional: string;
  imagenUrl: string;
  destacado: boolean;
  idAsociacion: string;
  idClub: string;
  unidadUvg: string;
};

export const VALORES_VACIOS: ValoresEvento = {
  nombre: "",
  descripcion: "",
  idCategoriaEvento: "",
  tipoActividad: "ACADEMICA",
  fechaInicio: "",
  fechaFin: "",
  ubicacion: "",
  cupo: "",
  informacionAdicional: "",
  imagenUrl: "",
  destacado: false,
  idAsociacion: "",
  idClub: "",
  unidadUvg: "",
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

/**
 * Formulario de creación y edición de eventos.
 *
 * Las fechas se envían con el desplazamiento de Guatemala explícito: el campo
 * del navegador entrega una hora sin zona y, sin indicarla, el servidor la
 * interpretaría en la suya.
 */
export function FormularioEvento({
  idEvento,
  valoresIniciales,
  categorias,
  organizadores,
}: {
  idEvento?: number;
  valoresIniciales: ValoresEvento;
  categorias: CategoriaResumen[];
  organizadores: OrganizadoresDisponibles;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = <Clave extends keyof ValoresEvento>(clave: Clave, valor: ValoresEvento[Clave]) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    try {
      const respuesta = await fetch(
        idEvento ? `/api/admin/eventos/${idEvento}` : "/api/admin/eventos",
        {
          method: idEvento ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...valores,
            fechaInicio: valores.fechaInicio ? desdeCampoFechaHora(valores.fechaInicio) : "",
            fechaFin: valores.fechaFin ? desdeCampoFechaHora(valores.fechaFin) : "",
          }),
        }
      );

      if (respuesta.ok) {
        router.push("/admin/eventos");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores) setErrores(cuerpo.errores);
      setGeneral(cuerpo.mensaje ?? (cuerpo.errores ? null : "No se pudo guardar el evento."));
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <Campo etiqueta="Nombre del evento" nombre="nombre" error={errores.nombre}>
        <input
          id="nombre"
          value={valores.nombre}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
          maxLength={200}
          className={claseCampo}
        />
      </Campo>

      <Campo etiqueta="Descripción" nombre="descripcion" error={errores.descripcion}>
        <textarea
          id="descripcion"
          value={valores.descripcion}
          onChange={(evento) => cambiar("descripcion", evento.target.value)}
          rows={5}
          maxLength={5000}
          className={claseCampo}
        />
      </Campo>

      <div className="grid gap-5 md:grid-cols-2">
        <Campo etiqueta="Categoría" nombre="idCategoriaEvento" error={errores.idCategoriaEvento}>
          <select
            id="idCategoriaEvento"
            value={valores.idCategoriaEvento}
            onChange={(evento) => cambiar("idCategoriaEvento", evento.target.value)}
            className={claseCampo}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.idCategoriaEvento} value={categoria.idCategoriaEvento}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Tipo de actividad" nombre="tipoActividad" error={errores.tipoActividad}>
          <select
            id="tipoActividad"
            value={valores.tipoActividad}
            onChange={(evento) => cambiar("tipoActividad", evento.target.value)}
            className={claseCampo}
          >
            {TIPOS_ACTIVIDAD.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_ACTIVIDAD[tipo]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Inicio" nombre="fechaInicio" error={errores.fechaInicio}>
          <input
            id="fechaInicio"
            type="datetime-local"
            value={valores.fechaInicio}
            onChange={(evento) => cambiar("fechaInicio", evento.target.value)}
            className={claseCampo}
          />
        </Campo>

        <Campo etiqueta="Finalización" nombre="fechaFin" error={errores.fechaFin}>
          <input
            id="fechaFin"
            type="datetime-local"
            value={valores.fechaFin}
            onChange={(evento) => cambiar("fechaFin", evento.target.value)}
            className={claseCampo}
          />
        </Campo>

        <Campo etiqueta="Ubicación" nombre="ubicacion" error={errores.ubicacion}>
          <input
            id="ubicacion"
            value={valores.ubicacion}
            onChange={(evento) => cambiar("ubicacion", evento.target.value)}
            maxLength={255}
            className={claseCampo}
          />
        </Campo>

        <Campo
          etiqueta="Cupo"
          nombre="cupo"
          error={errores.cupo}
          ayuda="Déjalo vacío si el evento no tiene cupo limitado."
        >
          <input
            id="cupo"
            type="number"
            min={1}
            value={valores.cupo}
            onChange={(evento) => cambiar("cupo", evento.target.value)}
            className={claseCampo}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Información adicional"
        nombre="informacionAdicional"
        error={errores.informacionAdicional}
        ayuda="Requisitos, inscripción previa, material necesario."
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

      <Campo
        etiqueta="Imagen del evento"
        nombre="imagenUrl"
        error={errores.imagenUrl}
        ayuda="Sube un archivo JPEG, PNG o WebP, o pega la dirección de una imagen. Si el evento no tiene imagen, se muestra el color de su categoría."
      >
        <input
          id="imagenUrl"
          type="url"
          value={valores.imagenUrl}
          onChange={(evento) => cambiar("imagenUrl", evento.target.value)}
          maxLength={500}
          className={claseCampo}
        />
        <CargaImagen
          valor={valores.imagenUrl}
          onCambio={(url) => cambiar("imagenUrl", url)}
          onError={(mensaje) => setErrores((previos) => ({ ...previos, imagenUrl: mensaje ?? "" }))}
        />
      </Campo>

      <fieldset className="border-borde flex flex-col gap-5 rounded-[1.25rem] border p-5">
        <legend className="text-texto px-2 text-sm font-bold">Organizadores</legend>
        {errores.idAsociacion && (
          <p role="alert" className="text-error text-xs font-medium">
            {errores.idAsociacion}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <Campo etiqueta="Asociación" nombre="idAsociacion">
            <select
              id="idAsociacion"
              value={valores.idAsociacion}
              onChange={(evento) => cambiar("idAsociacion", evento.target.value)}
              className={claseCampo}
            >
              <option value="">Ninguna</option>
              {organizadores.asociaciones.map((asociacion) => (
                <option key={asociacion.id} value={asociacion.id}>
                  {asociacion.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Club" nombre="idClub">
            <select
              id="idClub"
              value={valores.idClub}
              onChange={(evento) => cambiar("idClub", evento.target.value)}
              className={claseCampo}
            >
              <option value="">Ninguno</option>
              {organizadores.clubes.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Unidad de UVG" nombre="unidadUvg" error={errores.unidadUvg}>
            <input
              id="unidadUvg"
              value={valores.unidadUvg}
              onChange={(evento) => cambiar("unidadUvg", evento.target.value)}
              maxLength={160}
              className={claseCampo}
            />
          </Campo>
        </div>
      </fieldset>

      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={valores.destacado}
          onChange={(evento) => cambiar("destacado", evento.target.checked)}
          className="accent-primario size-4"
        />
        Destacar en la página principal
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" cargando={guardando}>
          {idEvento ? "Guardar cambios" : "Crear evento"}
        </Boton>
        <Boton type="button" variante="contorno" onClick={() => router.push("/admin/eventos")}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
