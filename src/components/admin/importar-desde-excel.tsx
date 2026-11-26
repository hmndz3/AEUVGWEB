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

type ErrorFila = { fila: number; referencia: string; campo: string; mensaje: string };
type FilaOmitida = { fila: number; referencia: string; mensaje: string };

type Reporte = {
  total: number;
  correctas: number;
  fallidas: number;
  errores: ErrorFila[];
  repetidas: FilaOmitida[];
  avisos: FilaOmitida[];
};

type Fase =
  | { nombre: "eligiendo" }
  | { nombre: "revisado"; reporte: Reporte }
  | { nombre: "importado"; reporte: Reporte };

/** Filas que se listan en pantalla; el resto se resume en una línea. */
const FILAS_VISIBLES = 20;

const REPORTE_VACIO: Reporte = {
  total: 0,
  correctas: 0,
  fallidas: 0,
  errores: [],
  repetidas: [],
  avisos: [],
};

function reporteDe(datos: Partial<Reporte>): Reporte {
  return {
    total: datos.total ?? 0,
    correctas: datos.correctas ?? 0,
    fallidas: datos.fallidas ?? 0,
    errores: datos.errores ?? [],
    repetidas: datos.repetidas ?? [],
    avisos: datos.avisos ?? [],
  };
}

export type TextosImportacion = {
  /** "evento", "asociación", "club". */
  singular: string;
  /** "eventos", "asociaciones", "clubes". */
  plural: string;
  /** Encabezado de la columna que identifica la fila. */
  referencia: string;
  /** Qué pasa con lo creado, para el mensaje final. Por ejemplo "quedan como borrador". */
  nota?: string;
};

/**
 * Carga de un Excel en dos pasos, para eventos, asociaciones y clubes.
 *
 * El primer paso revisa el archivo sin escribir nada y dice qué filas están
 * bien, cuáles ya existían y cuáles tienen problemas. Solo después de verlo se
 * confirma la carga. Es la diferencia entre descubrir los errores antes o
 * después de haber guardado medio archivo.
 *
 * El archivo se conserva en el navegador entre los dos pasos y se envía otra vez
 * al confirmar, de modo que el servidor no tenga que guardarlo a medio camino.
 */
export function ImportarDesdeExcel({
  endpoint,
  textos,
}: {
  endpoint: string;
  textos: TextosImportacion;
}) {
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

      const respuesta = await fetch(endpoint, { method: "POST", body: cuerpo });
      const datos = (await respuesta.json().catch(() => ({}))) as Partial<Reporte> & {
        mensaje?: string;
      };

      if (!respuesta.ok) {
        setError(datos.mensaje ?? "No se pudo procesar el archivo.");
        setFase(
          datos.errores || datos.repetidas
            ? { nombre: "revisado", reporte: reporteDe(datos) }
            : { nombre: "eligiendo" }
        );
        return;
      }

      setFase({
        nombre: accion === "importar" ? "importado" : "revisado",
        reporte: reporteDe(datos),
      });

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

  const reporte = fase.nombre === "eligiendo" ? REPORTE_VACIO : fase.reporte;
  const nuevas = reporte.correctas === 1 ? textos.singular : textos.plural;

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

        {fase.nombre === "revisado" && reporte.correctas > 0 && (
          <Boton cargando={trabajando} onClick={() => enviar("importar")}>
            Crear {reporte.correctas} {nuevas}
          </Boton>
        )}
      </div>

      {error && (
        <Alerta tipo="error" titulo="No se guardó nada">
          {error}
        </Alerta>
      )}

      {fase.nombre === "revisado" && !error && reporte.fallidas > 0 && (
        <Alerta tipo="advertencia" titulo={`${reporte.fallidas} filas con problemas`}>
          Revisa la lista de abajo, corrige el archivo y vuelve a cargarlo. Si confirmas ahora, solo
          se crean las filas correctas.
        </Alerta>
      )}

      {fase.nombre === "importado" && (
        <Alerta tipo="exito" titulo="Carga terminada">
          Se crearon {reporte.correctas} de {reporte.total} filas
          {textos.nota ? `; ${textos.nota}` : ""}.
          {reporte.repetidas.length > 0 &&
            ` ${reporte.repetidas.length} ya existían y se omitieron.`}
          {reporte.fallidas > 0 &&
            ` ${reporte.fallidas} quedaron fuera por los problemas de la lista.`}
        </Alerta>
      )}

      {reporte.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { titulo: "Filas leídas", valor: reporte.total },
            {
              titulo: fase.nombre === "importado" ? "Creadas" : "Nuevas",
              valor: reporte.correctas,
            },
            { titulo: "Ya existían", valor: reporte.repetidas.length },
            { titulo: "Con problemas", valor: reporte.fallidas },
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

      {reporte.errores.length > 0 && (
        <section>
          <h2 className="text-texto text-lg font-bold">Filas con problemas</h2>
          <p className="text-texto-suave mt-1 text-sm leading-relaxed">
            El número de fila es el que muestra Excel, para que puedas corregirlo en el mismo
            archivo y volver a cargarlo.
          </p>

          <div className="mt-4">
            <Tabla className="min-w-[40rem]">
              <TablaEncabezado>
                <tr>
                  <TablaCeldaEncabezado>Fila</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>{textos.referencia}</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>Campo</TablaCeldaEncabezado>
                  <TablaCeldaEncabezado>Problema</TablaCeldaEncabezado>
                </tr>
              </TablaEncabezado>
              <TablaCuerpo>
                {reporte.errores.slice(0, FILAS_VISIBLES).map((problema) => (
                  <TablaFila key={`${problema.fila}-${problema.campo}`}>
                    <TablaCelda className="text-texto font-mono font-bold">
                      {problema.fila}
                    </TablaCelda>
                    <TablaCelda className="text-texto-suave">
                      {problema.referencia || "—"}
                    </TablaCelda>
                    <TablaCelda className="text-texto-suave">{problema.campo}</TablaCelda>
                    <TablaCelda className="text-texto">{problema.mensaje}</TablaCelda>
                  </TablaFila>
                ))}
              </TablaCuerpo>
            </Tabla>
          </div>

          {reporte.errores.length > FILAS_VISIBLES && (
            <p className="text-texto-suave mt-3 text-xs">
              Se muestran las primeras {FILAS_VISIBLES} de {reporte.errores.length} filas con
              problemas.
            </p>
          )}
        </section>
      )}

      {reporte.repetidas.length > 0 && (
        <ListaSimple
          titulo="Filas que ya existían"
          descripcion={`No se crearon de nuevo. Puedes volver a cargar el mismo archivo cuando lo actualices: solo se agregan los ${textos.plural} que falten.`}
          referencia={textos.referencia}
          filas={reporte.repetidas}
        />
      )}

      {reporte.avisos.length > 0 && (
        <ListaSimple
          titulo="Detalles de las filas que sí se crearon"
          descripcion="Lo demás de la fila quedó guardado; esto puedes completarlo desde su ficha."
          referencia={textos.referencia}
          filas={reporte.avisos}
        />
      )}
    </div>
  );
}

function ListaSimple({
  titulo,
  descripcion,
  referencia,
  filas,
}: {
  titulo: string;
  descripcion: string;
  referencia: string;
  filas: FilaOmitida[];
}) {
  return (
    <section>
      <h2 className="text-texto text-lg font-bold">{titulo}</h2>
      <p className="text-texto-suave mt-1 text-sm leading-relaxed">{descripcion}</p>

      <div className="mt-4">
        <Tabla className="min-w-[36rem]">
          <TablaEncabezado>
            <tr>
              <TablaCeldaEncabezado>Fila</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>{referencia}</TablaCeldaEncabezado>
              <TablaCeldaEncabezado>Qué pasó</TablaCeldaEncabezado>
            </tr>
          </TablaEncabezado>
          <TablaCuerpo>
            {filas.slice(0, FILAS_VISIBLES).map((fila) => (
              <TablaFila key={`${fila.fila}-${fila.mensaje}`}>
                <TablaCelda className="text-texto font-mono font-bold">{fila.fila}</TablaCelda>
                <TablaCelda className="text-texto-suave">{fila.referencia || "—"}</TablaCelda>
                <TablaCelda className="text-texto">{fila.mensaje}</TablaCelda>
              </TablaFila>
            ))}
          </TablaCuerpo>
        </Tabla>
      </div>

      {filas.length > FILAS_VISIBLES && (
        <p className="text-texto-suave mt-3 text-xs">
          Se muestran las primeras {FILAS_VISIBLES} de {filas.length} filas.
        </p>
      )}
    </section>
  );
}
