"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import {
  Tabla,
  TablaCelda,
  TablaCeldaEncabezado,
  TablaCuerpo,
  TablaEncabezado,
  TablaFila,
} from "@/components/ui/tabla";

type ErrorFila = { fila: number; carnet: string; campo: string; mensaje: string };

type Revision = { total: number; correctas: number; fallidas: number; errores: ErrorFila[] };

type Fase =
  | { nombre: "eligiendo" }
  | { nombre: "revisado"; revision: Revision }
  | { nombre: "importado"; revision: Revision };

/** Errores que se listan en pantalla; el resto se resume en una línea. */
const ERRORES_VISIBLES = 20;

/**
 * Importación de horas beca desde un archivo de Excel, en dos pasos.
 *
 * El primer paso revisa el archivo sin escribir nada y dice cuántas filas están
 * bien y cuáles no. Solo después de verlo se confirma la carga. Es la diferencia
 * entre descubrir los errores antes o después de haber guardado medio archivo.
 *
 * El archivo se conserva en el navegador entre los dos pasos y se envía otra vez
 * al confirmar, de modo que el servidor no tenga que guardarlo a medio camino.
 */
export function ImportarHorasBeca() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fase, setFase] = useState<Fase>({ nombre: "eligiendo" });
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(accion: "revisar" | "importar") {
    if (!archivo) return;

    setTrabajando(true);
    setError(null);

    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", archivo);
      cuerpo.append("accion", accion);

      const respuesta = await fetch("/api/admin/horas-beca/importar", {
        method: "POST",
        body: cuerpo,
      });
      const datos = (await respuesta.json().catch(() => ({}))) as Partial<Revision> & {
        mensaje?: string;
        errores?: ErrorFila[];
      };

      if (!respuesta.ok) {
        setError(datos.mensaje ?? "No se pudo procesar el archivo.");
        if (datos.errores) {
          setFase({
            nombre: "revisado",
            revision: {
              total: datos.total ?? 0,
              correctas: 0,
              fallidas: datos.errores.length,
              errores: datos.errores,
            },
          });
        }
        return;
      }

      const revision: Revision = {
        total: datos.total ?? 0,
        correctas: datos.correctas ?? 0,
        fallidas: datos.fallidas ?? 0,
        errores: datos.errores ?? [],
      };

      setFase({ nombre: accion === "importar" ? "importado" : "revisado", revision });

      if (accion === "importar") {
        setArchivo(null);
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  const revision = fase.nombre === "eligiendo" ? null : fase.revision;

  return (
    <div className="flex flex-col gap-5">
      <div className="border-borde bg-superficie flex flex-wrap items-end gap-3 rounded-[1.25rem] border p-5">
        <div className="flex min-w-64 flex-1 flex-col gap-1.5">
          <label htmlFor="archivo" className="text-texto text-sm font-semibold">
            Archivo de Excel
          </label>
          <input
            id="archivo"
            type="file"
            accept=".xlsx"
            onChange={(evento) => {
              setArchivo(evento.target.files?.[0] ?? null);
              setFase({ nombre: "eligiendo" });
              setError(null);
            }}
            className="text-texto-suave file:border-borde file:bg-superficie-suave file:text-texto text-sm file:mr-3 file:rounded-full file:border file:px-4 file:py-2 file:text-sm file:font-bold"
          />
          <p className="text-texto-suave text-xs">
            Primero se revisa el archivo y se muestra qué filas tienen problemas. Nada se guarda
            hasta que lo confirmes.
          </p>
        </div>

        <Boton
          variante="contorno"
          disabled={!archivo}
          cargando={trabajando && fase.nombre === "eligiendo"}
          onClick={() => enviar("revisar")}
        >
          Revisar archivo
        </Boton>

        {fase.nombre === "revisado" && fase.revision.correctas > 0 && (
          <Boton cargando={trabajando} onClick={() => enviar("importar")}>
            Importar {fase.revision.correctas}{" "}
            {fase.revision.correctas === 1 ? "registro" : "registros"}
          </Boton>
        )}
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}

      {fase.nombre === "importado" && (
        <Alerta tipo="exito" titulo="Importación terminada">
          Se guardaron {fase.revision.correctas} de {fase.revision.total} filas.
          {fase.revision.fallidas > 0 &&
            ` Las ${fase.revision.fallidas} restantes quedaron fuera por los problemas de la lista.`}
        </Alerta>
      )}

      {revision && revision.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { titulo: "Filas leídas", valor: revision.total },
            { titulo: "Correctas", valor: revision.correctas },
            { titulo: "Con problemas", valor: revision.fallidas },
          ].map((dato) => (
            <div
              key={dato.titulo}
              className="border-borde bg-superficie rounded-[1.25rem] border px-5 py-4"
            >
              <p className="text-texto-suave text-xs font-bold tracking-wide uppercase">
                {dato.titulo}
              </p>
              <p className="text-texto mt-1 text-2xl font-extrabold tracking-tight">{dato.valor}</p>
            </div>
          ))}
        </div>
      )}

      {revision && revision.errores.length > 0 && (
        <div>
          <h2 className="text-texto text-lg font-bold">Filas con problemas</h2>
          <p className="text-texto-suave mt-1 text-sm leading-relaxed">
            El número de fila es el que muestra Excel, para que puedas corregirlo en el mismo
            archivo y volver a cargarlo.
          </p>

          <div className="mt-4">
            <Tabla className="min-w-[36rem]">
              <TablaEncabezado>
                <tr>
                  <TablaCeldaEncabezado>Fila</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>Carnet</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>Campo</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>Problema</TablaCeldaEncabezado>
                </tr>
              </TablaEncabezado>
              <TablaCuerpo>
                {revision.errores.slice(0, ERRORES_VISIBLES).map((problema) => (
                  <TablaFila key={`${problema.fila}-${problema.campo}`}>
                    <TablaCelda className="text-texto font-mono font-bold">
                      {problema.fila}
                    </TablaCelda>
                    <TablaCelda className="text-texto-suave font-mono">
                      {problema.carnet || "—"}
                    </TablaCelda>
                    <TablaCelda className="text-texto-suave">{problema.campo}</TablaCelda>
                    <TablaCelda className="text-texto">{problema.mensaje}</TablaCelda>
                  </TablaFila>
                ))}
              </TablaCuerpo>
            </Tabla>
          </div>

          {revision.errores.length > ERRORES_VISIBLES && (
            <p className="text-texto-suave mt-3 text-xs">
              Se muestran las primeras {ERRORES_VISIBLES} de {revision.errores.length} filas con
              problemas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
