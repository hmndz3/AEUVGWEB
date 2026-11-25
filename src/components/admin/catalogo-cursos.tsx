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
import type { CursoPanel } from "@/lib/tutorias/consultas-tutorias";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 h-11 w-full rounded-2xl border px-4 text-sm focus:ring-2 focus:outline-none";

type Borrador = { codigo: string; nombre: string; activo: boolean };

/** Envía un curso al panel y devuelve los errores por campo o un mensaje. */
async function guardarCurso(
  ruta: string,
  metodo: "POST" | "PATCH",
  datos: Borrador
): Promise<{ errores?: Record<string, string>; mensaje?: string } | null> {
  try {
    const respuesta = await fetch(ruta, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (respuesta.ok) return null;

    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      errores?: Record<string, string>;
      mensaje?: string;
    };

    return cuerpo.errores || cuerpo.mensaje
      ? cuerpo
      : { mensaje: "No se pudo guardar el curso. Intenta de nuevo." };
  } catch {
    return { mensaje: "No se pudo conectar con el servidor. Revisa tu conexión." };
  }
}

/** Primer error del servidor, en una frase para mostrarlo arriba. */
function primerError(resultado: { errores?: Record<string, string>; mensaje?: string }) {
  return resultado.mensaje ?? Object.values(resultado.errores ?? {})[0] ?? "Revisa los datos.";
}

/** Alta de un curso en el catálogo. */
export function FormularioCurso() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);

    const resultado = await guardarCurso("/api/admin/tutorias/cursos", "POST", {
      codigo,
      nombre,
      activo: true,
    });

    setGuardando(false);

    if (resultado) {
      setErrores(resultado.errores ?? {});
      setGeneral(primerError(resultado));
      return;
    }

    setCodigo("");
    setNombre("");
    router.refresh();
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="border-borde bg-superficie-suave flex flex-col gap-3 rounded-[1.25rem] border p-4"
    >
      {general && <Alerta tipo="error">{general}</Alerta>}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-40 flex-col gap-1.5">
          <EtiquetaCampo htmlFor="codigo-nuevo" obligatorio>
            Código
          </EtiquetaCampo>
          <input
            id="codigo-nuevo"
            required
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            maxLength={30}
            placeholder="MM2015"
            aria-invalid={Boolean(errores.codigo)}
            className={claseCampo}
          />
        </div>

        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <EtiquetaCampo htmlFor="nombre-nuevo" obligatorio>
            Nombre
          </EtiquetaCampo>
          <input
            id="nombre-nuevo"
            required
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            maxLength={160}
            placeholder="Cálculo 1"
            aria-invalid={Boolean(errores.nombre)}
            className={claseCampo}
          />
        </div>

        <Boton type="submit" cargando={guardando} disabled={!codigo.trim() || !nombre.trim()}>
          Agregar curso
        </Boton>
      </div>
    </form>
  );
}

/** Una fila del catálogo, que se edita en el mismo lugar. */
function FilaCurso({ curso }: { curso: CursoPanel }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<Borrador>({
    codigo: curso.codigo,
    nombre: curso.nombre,
    activo: curso.activo,
  });
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usos = curso.postulaciones + curso.tutores + curso.tutorias;

  async function guardar(datos: Borrador) {
    setTrabajando(true);
    setError(null);

    const resultado = await guardarCurso(
      `/api/admin/tutorias/cursos/${curso.idCurso}`,
      "PATCH",
      datos
    );

    setTrabajando(false);

    if (resultado) {
      setError(primerError(resultado));
      return;
    }

    setEditando(false);
    router.refresh();
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar el curso ${curso.codigo} · ${curso.nombre}?`)) return;

    setTrabajando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/admin/tutorias/cursos/${curso.idCurso}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
        setError(cuerpo.mensaje ?? "No se pudo eliminar el curso.");
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <TablaFila>
      <TablaCelda className="align-top">
        {editando ? (
          <input
            aria-label="Código"
            value={borrador.codigo}
            onChange={(evento) => setBorrador({ ...borrador, codigo: evento.target.value })}
            maxLength={30}
            className={claseCampo}
          />
        ) : (
          <span className="text-texto font-mono font-semibold">{curso.codigo}</span>
        )}
      </TablaCelda>
      <TablaCelda className="align-top">
        {editando ? (
          <input
            aria-label="Nombre"
            value={borrador.nombre}
            onChange={(evento) => setBorrador({ ...borrador, nombre: evento.target.value })}
            maxLength={160}
            className={claseCampo}
          />
        ) : (
          <span className="text-texto">{curso.nombre}</span>
        )}
        {error && (
          <p role="alert" className="text-error mt-1 text-xs font-medium">
            {error}
          </p>
        )}
      </TablaCelda>
      <TablaCelda className="align-top">
        {curso.propuesto ? (
          <EtiquetaEstado tono="pendiente">Propuesto</EtiquetaEstado>
        ) : curso.activo ? (
          <EtiquetaEstado tono="acreditada">Activo</EtiquetaEstado>
        ) : (
          <EtiquetaEstado tono="neutro">Inactivo</EtiquetaEstado>
        )}
      </TablaCelda>
      <TablaCelda className="text-texto-suave text-right align-top">{curso.tutores}</TablaCelda>
      <TablaCelda className="text-texto-suave text-right align-top">
        {curso.postulaciones}
      </TablaCelda>
      <TablaCelda className="align-top">
        <div className="flex flex-wrap justify-end gap-2">
          {editando ? (
            <>
              <Boton
                type="button"
                tamano="sm"
                cargando={trabajando}
                onClick={() => guardar(borrador)}
              >
                Guardar
              </Boton>
              <Boton
                type="button"
                tamano="sm"
                variante="contorno"
                disabled={trabajando}
                onClick={() => {
                  setBorrador({ codigo: curso.codigo, nombre: curso.nombre, activo: curso.activo });
                  setError(null);
                  setEditando(false);
                }}
              >
                Cancelar
              </Boton>
            </>
          ) : (
            <>
              <Boton
                type="button"
                tamano="sm"
                variante="contorno"
                onClick={() => setEditando(true)}
              >
                Editar
              </Boton>
              <Boton
                type="button"
                tamano="sm"
                variante={curso.activo ? "contorno" : "primario"}
                disabled={trabajando}
                onClick={() =>
                  guardar({ codigo: curso.codigo, nombre: curso.nombre, activo: !curso.activo })
                }
              >
                {curso.activo ? "Desactivar" : curso.propuesto ? "Admitir" : "Activar"}
              </Boton>
              {/* Solo se borra lo que nadie usa: con historial, se desactiva. */}
              {usos === 0 && (
                <Boton
                  type="button"
                  tamano="sm"
                  variante="texto"
                  disabled={trabajando}
                  onClick={eliminar}
                  className="text-error"
                >
                  Eliminar
                </Boton>
              )}
            </>
          )}
        </div>
      </TablaCelda>
    </TablaFila>
  );
}

/**
 * Catálogo de cursos para tutorías.
 *
 * Los activos son los que se ofrecen en la postulación y en el filtro del
 * directorio. Los propuestos llegaron con la opción "Otro" y esperan que
 * AEUVG los admita, cosa que también ocurre al aprobar la postulación.
 */
export function TablaCursos({ cursos }: { cursos: CursoPanel[] }) {
  return (
    <Tabla className="min-w-[52rem]">
      <TablaEncabezado>
        <tr>
          <TablaCeldaEncabezado className="w-44">Código</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Nombre</TablaCeldaEncabezado>
          <TablaCeldaEncabezado>Estado</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Tutores</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Postulaciones</TablaCeldaEncabezado>
          <TablaCeldaEncabezado className="text-right">Acciones</TablaCeldaEncabezado>
        </tr>
      </TablaEncabezado>
      <TablaCuerpo>
        {cursos.map((curso) => (
          <FilaCurso
            key={`${curso.idCurso}-${curso.codigo}-${curso.nombre}-${curso.activo}`}
            curso={curso}
          />
        ))}
      </TablaCuerpo>
    </Tabla>
  );
}
