"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import type { FacultadDisponible } from "@/lib/perfil/consultas-perfil";
import { ETIQUETAS_CAMPO_PERFIL } from "@/validators/perfil";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none disabled:opacity-60";

/**
 * Edición de los datos que el estudiante sí puede cambiar.
 *
 * Se abre dentro de "Datos de la cuenta" en lugar de vivir en una tarjeta
 * aparte: quien quiere corregir su teléfono lo está viendo justo ahí. La
 * facultad y la carrera se eligen por separado, igual que al crear la cuenta;
 * la facultad solo filtra las carreras y el servidor la deduce de la carrera.
 */
export function FormularioPerfil({
  telefono: telefonoInicial,
  idFacultad: idFacultadInicial,
  idCarrera: idCarreraInicial,
  facultades,
  onCancelar,
  onGuardado,
}: {
  telefono: string | null;
  idFacultad: number;
  idCarrera: number;
  facultades: FacultadDisponible[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const router = useRouter();
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [idFacultad, setIdFacultad] = useState(String(idFacultadInicial));
  const [idCarrera, setIdCarrera] = useState(String(idCarreraInicial));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const carreras =
    facultades.find((facultad) => facultad.idFacultad === Number(idFacultad))?.carreras ?? [];

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrores({});
    setGeneral(null);

    if (idCarrera === "") {
      setErrores({ idCarrera: "Selecciona tu carrera." });
      setGeneral(`Revisa el campo ${ETIQUETAS_CAMPO_PERFIL.idCarrera}: Selecciona tu carrera.`);
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, idCarrera }),
      });

      if (respuesta.ok) {
        // Los datos de la cuenta los genera el servidor, así que se refresca
        // la ruta para que la carrera nueva se vea al cerrar el formulario.
        router.refresh();
        onGuardado();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
        setErrores(cuerpo.errores);
        const campo = Object.keys(cuerpo.errores)[0];
        setGeneral(
          `Revisa el campo ${ETIQUETAS_CAMPO_PERFIL[campo] ?? campo}: ${cuerpo.errores[campo]}`
        );
        return;
      }

      setGeneral(cuerpo.mensaje ?? "No se pudo guardar el perfil. Intenta de nuevo.");
    } catch {
      setGeneral("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-4 flex flex-col gap-5">
      {general && <Alerta tipo="error">{general}</Alerta>}

      <NotaCamposObligatorios />

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="telefono">Teléfono</EtiquetaCampo>
        <input
          id="telefono"
          value={telefono}
          onChange={(evento) => setTelefono(evento.target.value)}
          maxLength={30}
          placeholder="5555 4444"
          className={claseCampo}
        />
        {errores.telefono ? (
          <p role="alert" className="text-error text-xs font-medium">
            {errores.telefono}
          </p>
        ) : (
          <p className="text-texto-suave text-xs">
            Opcional. AEUVG lo usa para contactarte por las actividades en las que participas.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="idFacultad" obligatorio>
            Facultad
          </EtiquetaCampo>
          <select
            id="idFacultad"
            required
            value={idFacultad}
            onChange={(evento) => {
              setIdFacultad(evento.target.value);
              // La carrera anterior no pertenece a la facultad nueva.
              setIdCarrera("");
            }}
            className={claseCampo}
          >
            <option value="">Selecciona tu facultad</option>
            {facultades.map((facultad) => (
              <option key={facultad.idFacultad} value={facultad.idFacultad}>
                {facultad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="idCarrera" obligatorio>
            Carrera
          </EtiquetaCampo>
          <select
            id="idCarrera"
            required
            value={idCarrera}
            disabled={idFacultad === ""}
            onChange={(evento) => setIdCarrera(evento.target.value)}
            className={claseCampo}
          >
            <option value="">Selecciona tu carrera</option>
            {carreras.map((carrera) => (
              <option key={carrera.idCarrera} value={carrera.idCarrera}>
                {carrera.nombre}
              </option>
            ))}
          </select>
          {errores.idCarrera && (
            <p role="alert" className="text-error text-xs font-medium">
              {errores.idCarrera}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando}>
          Guardar cambios
        </Boton>
        <Boton type="button" variante="contorno" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
