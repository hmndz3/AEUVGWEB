"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CargaImagen } from "@/components/admin/carga-imagen";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import type { IntegranteAdministrado } from "@/lib/organizaciones/repositorio-organizaciones";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

type Valores = {
  nombre: string;
  cargo: string;
  periodo: string;
  fotoUrl: string;
  ordenVisualizacion: string;
};

const VACIOS: Valores = { nombre: "", cargo: "", periodo: "", fotoUrl: "", ordenVisualizacion: "" };

/**
 * Junta directiva de una asociación desde el panel.
 *
 * Vive aparte del formulario de la ficha porque un integrante se guarda por su
 * cuenta: obligar a reenviar toda la asociación para corregir un cargo haría
 * perder los demás cambios a medio escribir. Por eso se administra solo al
 * editar, cuando la asociación ya tiene identificador.
 */
export function EditorJuntaDirectiva({
  idAsociacion,
  integrantes,
}: {
  idAsociacion: number;
  integrantes: IntegranteAdministrado[];
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>(VACIOS);
  const [editando, setEditando] = useState<number | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const base = `/api/admin/organizaciones/asociaciones/${idAsociacion}/integrantes`;

  const cambiar = <Clave extends keyof Valores>(clave: Clave, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  function limpiar() {
    setValores(VACIOS);
    setEditando(null);
    setErrores({});
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setMensaje(null);

    try {
      const respuesta = await fetch(editando ? `${base}/${editando}` : base, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (respuesta.ok) {
        limpiar();
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores) setErrores(cuerpo.errores);
      else setMensaje(cuerpo.mensaje ?? "No se pudo guardar el integrante.");
    } catch {
      setMensaje("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(idIntegrante: number) {
    if (!window.confirm("El integrante se quitará de la junta directiva. ¿Continuar?")) return;

    setMensaje(null);

    try {
      const respuesta = await fetch(`${base}/${idIntegrante}`, { method: "DELETE" });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setMensaje(cuerpo.mensaje ?? "No se pudo quitar el integrante.");
        return;
      }

      if (editando === idIntegrante) limpiar();
      router.refresh();
    } catch {
      setMensaje("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  function editar(integrante: IntegranteAdministrado) {
    setEditando(integrante.idIntegrante);
    setErrores({});
    setValores({
      nombre: integrante.nombre,
      cargo: integrante.cargo,
      periodo: integrante.periodo,
      fotoUrl: integrante.fotoUrl ?? "",
      ordenVisualizacion: String(integrante.ordenVisualizacion),
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-xl font-bold">Junta directiva</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          El orden decide cómo se presentan en la página de la asociación: 1 aparece primero. Quien
          no tenga fotografía se muestra con sus iniciales.
        </p>
      </div>

      {mensaje && <Alerta tipo="error">{mensaje}</Alerta>}

      {integrantes.length > 0 && (
        <Tabla>
          <TablaEncabezado>
            <tr>
              <TablaCeldaEncabezado>Orden</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Integrante</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Periodo</TablaCeldaEncabezado>
              <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
            </tr>
          </TablaEncabezado>
          <TablaCuerpo>
            {integrantes.map((integrante) => (
              <TablaFila key={integrante.idIntegrante}>
                <TablaCelda className="text-texto-suave">
                  {integrante.ordenVisualizacion}
                </TablaCelda>
                <TablaCelda>
                  <span className="text-texto font-semibold">{integrante.nombre}</span>
                  <span className="text-texto-suave mt-0.5 block text-xs">{integrante.cargo}</span>
                </TablaCelda>
                <TablaCelda className="text-texto-suave whitespace-nowrap">
                  {integrante.periodo}
                </TablaCelda>
                <TablaCelda>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Boton
                      type="button"
                      tamano="sm"
                      variante="contorno"
                      onClick={() => editar(integrante)}
                    >
                      Editar
                    </Boton>
                    <Boton
                      type="button"
                      tamano="sm"
                      variante="destructivo"
                      onClick={() => quitar(integrante.idIntegrante)}
                    >
                      Quitar
                    </Boton>
                  </div>
                </TablaCelda>
              </TablaFila>
            ))}
          </TablaCuerpo>
        </Tabla>
      )}

      <form
        onSubmit={guardar}
        noValidate
        className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5"
      >
        <p className="text-texto text-sm font-bold">
          {editando ? "Editar integrante" : "Agregar integrante"}
        </p>
        <NotaCamposObligatorios />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <EtiquetaCampo htmlFor="integrante-nombre" obligatorio>
              Nombre
            </EtiquetaCampo>
            <input
              id="integrante-nombre"
              required
              value={valores.nombre}
              onChange={(evento) => cambiar("nombre", evento.target.value)}
              maxLength={200}
              className={claseCampo}
            />
            {errores.nombre && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <EtiquetaCampo htmlFor="integrante-cargo" obligatorio>
              Cargo
            </EtiquetaCampo>
            <input
              id="integrante-cargo"
              required
              value={valores.cargo}
              onChange={(evento) => cambiar("cargo", evento.target.value)}
              maxLength={120}
              className={claseCampo}
            />
            {errores.cargo && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.cargo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <EtiquetaCampo htmlFor="integrante-periodo" obligatorio>
              Periodo
            </EtiquetaCampo>
            <input
              id="integrante-periodo"
              required
              value={valores.periodo}
              onChange={(evento) => cambiar("periodo", evento.target.value)}
              maxLength={50}
              placeholder="2026"
              className={claseCampo}
            />
            {errores.periodo && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.periodo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <EtiquetaCampo htmlFor="integrante-ordenVisualizacion">Orden</EtiquetaCampo>
            <input
              id="integrante-ordenVisualizacion"
              type="number"
              min={0}
              max={999}
              value={valores.ordenVisualizacion}
              onChange={(evento) => cambiar("ordenVisualizacion", evento.target.value)}
              className={claseCampo}
            />
            {errores.ordenVisualizacion && (
              <p role="alert" className="text-error text-xs font-medium">
                {errores.ordenVisualizacion}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="integrante-fotoUrl">Fotografía</EtiquetaCampo>
          <input
            id="integrante-fotoUrl"
            value={valores.fotoUrl}
            onChange={(evento) => cambiar("fotoUrl", evento.target.value)}
            maxLength={500}
            placeholder="https://ejemplo.com/retrato.jpg"
            className={claseCampo}
          />
          <CargaImagen
            valor={valores.fotoUrl}
            descripcion="Vista previa del retrato del integrante"
            onCambio={(url) => cambiar("fotoUrl", url)}
            onError={(aviso) => setMensaje(aviso)}
          />
          {errores.fotoUrl && (
            <p role="alert" className="text-error text-xs font-medium">
              {errores.fotoUrl}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Boton type="submit" tamano="sm" cargando={guardando}>
            {editando ? "Guardar integrante" : "Agregar integrante"}
          </Boton>
          {editando && (
            <Boton type="button" tamano="sm" variante="contorno" onClick={limpiar}>
              Cancelar
            </Boton>
          )}
        </div>
      </form>
    </section>
  );
}
