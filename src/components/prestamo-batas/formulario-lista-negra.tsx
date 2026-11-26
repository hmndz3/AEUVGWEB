"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import { SelectorFecha } from "@/components/ui/selector-fecha";

/**
 * Registro en la lista negra: alguien que no devolvió una bata o la devolvió con
 * un problema. Solo el nombre y la justificación son obligatorios; el resto
 * puede quedar en blanco si no se conoce.
 */
export function FormularioListaNegra() {
  const router = useRouter();
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [carnet, setCarnet] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/prestamo-batas/lista-negra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha || null,
          nombre,
          apellido,
          carnet,
          correo,
          telefono,
          justificacion,
        }),
      });

      if (respuesta.ok) {
        setExito(true);
        setFecha("");
        setNombre("");
        setApellido("");
        setCarnet("");
        setCorreo("");
        setTelefono("");
        setJustificacion("");
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };
      setError(
        Object.values(cuerpo.errores ?? {})[0] ?? cuerpo.mensaje ?? "No se pudo guardar la entrada."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <NotaCamposObligatorios />

      {exito && <Alerta tipo="exito">La persona quedó registrada en la lista negra.</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo>Fecha del incidente</EtiquetaCampo>
          <SelectorFecha id="fecha-lista-negra" valor={fecha} onCambiar={setFecha} />
        </div>
        <Campo
          etiqueta="Carné"
          name="carnet-ln"
          value={carnet}
          onChange={(e) => setCarnet(e.target.value)}
        />
        <Campo
          etiqueta="Nombre"
          name="nombre-ln"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Campo
          etiqueta="Apellido"
          name="apellido-ln"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />
        <Campo
          etiqueta="Correo"
          name="correo-ln"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Campo
          etiqueta="Teléfono"
          name="telefono-ln"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="justificacion" obligatorio>
          Justificación
        </EtiquetaCampo>
        <textarea
          id="justificacion"
          required
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Qué pasó: no devolvió la bata, la devolvió dañada, etc."
          className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      <div>
        <Boton type="submit" variante="secundario" cargando={enviando}>
          Agregar a la lista negra
        </Boton>
      </div>
    </form>
  );
}
