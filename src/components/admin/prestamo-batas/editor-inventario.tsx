"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import { EtiquetaEstado } from "@/components/ui/etiqueta-estado";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";
import {
  ETIQUETAS_TIPO_ARTICULO,
  TALLAS,
  TIPOS_ARTICULO,
} from "@/lib/prestamo-batas/formato-prestamo-batas";
import type { ArticuloPanel } from "@/lib/prestamo-batas/consultas-prestamo-batas";
import type { TallaBata, TipoArticuloBata } from "@prisma/client";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 w-full rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

type Edicion = { idArticulo: number | null } & {
  tipo: TipoArticuloBata;
  talla: TallaBata | "";
  cantidadTotal: string;
  activo: boolean;
};

const NUEVO: Edicion = {
  idArticulo: null,
  tipo: "BATA_AZUL",
  talla: "M",
  cantidadTotal: "0",
  activo: true,
};

/** Inventario de batas y lentes que AEUVG gestiona: alta, edición y baja de artículos. */
export function EditorInventario({ articulos }: { articulos: ArticuloPanel[] }) {
  const router = useRouter();
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setError(null);
    setEdicion({ ...NUEVO });
  }

  function abrirEdicion(articulo: ArticuloPanel) {
    setError(null);
    setEdicion({
      idArticulo: articulo.idArticulo,
      tipo: articulo.tipo as TipoArticuloBata,
      talla: (articulo.talla ?? "") as TallaBata | "",
      cantidadTotal: articulo.cantidadTotal.toString(),
      activo: articulo.activo,
    });
  }

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!edicion) return;
    setError(null);
    setGuardando(true);

    const esLentes = edicion.tipo === "LENTES";
    const cuerpo = {
      tipo: edicion.tipo,
      talla: esLentes ? null : edicion.talla || null,
      cantidadTotal: Number(edicion.cantidadTotal),
      activo: edicion.activo,
    };

    const url =
      edicion.idArticulo === null
        ? "/api/admin/prestamo-batas/inventario"
        : `/api/admin/prestamo-batas/inventario/${edicion.idArticulo}`;

    try {
      const respuesta = await fetch(url, {
        method: edicion.idArticulo === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      if (respuesta.ok) {
        setEdicion(null);
        router.refresh();
        return;
      }

      const datos = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(datos.errores ?? {})[0] ?? datos.mensaje ?? "No se pudo guardar el artículo."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(idArticulo: number) {
    if (!confirm("¿Eliminar este artículo del inventario?")) return;
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/prestamo-batas/inventario/${idArticulo}`, {
        method: "DELETE",
      });
      if (respuesta.ok) {
        router.refresh();
        return;
      }
      const datos = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
      setError(datos.mensaje ?? "No se pudo eliminar el artículo.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <Alerta tipo="error">{error}</Alerta>}

      {edicion ? (
        <form
          onSubmit={guardar}
          noValidate
          className="border-borde bg-superficie flex flex-col gap-4 rounded-[1.25rem] border p-5"
        >
          <h3 className="text-texto text-base font-bold">
            {edicion.idArticulo === null ? "Nuevo artículo" : "Editar artículo"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo htmlFor="tipo-articulo" obligatorio>
                Tipo
              </EtiquetaCampo>
              <select
                id="tipo-articulo"
                value={edicion.tipo}
                onChange={(e) =>
                  setEdicion({ ...edicion, tipo: e.target.value as TipoArticuloBata })
                }
                className={claseCampo}
              >
                {TIPOS_ARTICULO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ETIQUETAS_TIPO_ARTICULO[tipo]}
                  </option>
                ))}
              </select>
            </div>

            {edicion.tipo !== "LENTES" && (
              <div className="flex flex-col gap-1.5">
                <EtiquetaCampo htmlFor="talla-articulo" obligatorio>
                  Talla
                </EtiquetaCampo>
                <select
                  id="talla-articulo"
                  value={edicion.talla}
                  onChange={(e) => setEdicion({ ...edicion, talla: e.target.value as TallaBata })}
                  className={claseCampo}
                >
                  {TALLAS.map((talla) => (
                    <option key={talla} value={talla}>
                      {talla}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <EtiquetaCampo htmlFor="cantidad-articulo" obligatorio>
                Cantidad total
              </EtiquetaCampo>
              <input
                id="cantidad-articulo"
                type="number"
                min={0}
                required
                value={edicion.cantidadTotal}
                onChange={(e) => setEdicion({ ...edicion, cantidadTotal: e.target.value })}
                className={claseCampo}
              />
            </div>
          </div>

          <label className="text-texto flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={edicion.activo}
              onChange={(e) => setEdicion({ ...edicion, activo: e.target.checked })}
              className="accent-primario size-4"
            />
            Disponible para prestar
          </label>

          <div className="flex gap-3">
            <Boton type="submit" cargando={guardando}>
              Guardar
            </Boton>
            <Boton type="button" variante="contorno" onClick={() => setEdicion(null)}>
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <div>
          <Boton type="button" onClick={abrirNuevo}>
            Agregar artículo
          </Boton>
        </div>
      )}

      {articulos.length === 0 ? (
        <div className="border-borde bg-superficie-suave text-texto-suave rounded-[1.25rem] border border-dashed px-6 py-10 text-center text-sm">
          No hay artículos en el inventario. Agrega el primero.
        </div>
      ) : (
        <Tabla>
          <TablaEncabezado>
            <tr>
              <TablaCeldaEncabezado>Artículo</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Total</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Prestadas</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Disponibles</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
              <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
            </tr>
          </TablaEncabezado>
          <TablaCuerpo>
            {articulos.map((articulo) => (
              <TablaFila key={articulo.idArticulo}>
                <TablaCelda className="text-texto font-semibold">{articulo.descripcion}</TablaCelda>
                <TablaCelda>{articulo.cantidadTotal}</TablaCelda>
                <TablaCelda>{articulo.cantidadPrestada}</TablaCelda>
                <TablaCelda className="font-semibold">{articulo.disponible}</TablaCelda>
                <TablaCelda>
                  <EtiquetaEstado tono={articulo.activo ? "acreditada" : "neutro"}>
                    {articulo.activo ? "Activo" : "Inactivo"}
                  </EtiquetaEstado>
                </TablaCelda>
                <TablaCelda className="text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(articulo)}
                    className="text-primario text-sm font-bold hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(articulo.idArticulo)}
                    className="text-error ml-4 text-sm font-bold hover:underline"
                  >
                    Eliminar
                  </button>
                </TablaCelda>
              </TablaFila>
            ))}
          </TablaCuerpo>
        </Tabla>
      )}
    </div>
  );
}
