"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Campo, claseCampo } from "@/components/admin/formulario-organizacion";
import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { ETIQUETAS_CAMPO_AEUVG } from "@/validators/organizacion-admin";

export type ValoresSobreAeuvg = {
  descripcion: string;
  mision: string;
  vision: string;
  correo: string;
  telefono: string;
  informacionContacto: string;
};

/**
 * Textos de la página Sobre AEUVG.
 *
 * Al guardar se queda en la misma pantalla, a diferencia de las fichas de las
 * asociaciones: aquí no hay listado al cual volver, y la junta directiva y las
 * redes se siguen editando debajo.
 */
export function FormularioSobreAeuvg({
  valoresIniciales,
}: {
  valoresIniciales: ValoresSobreAeuvg;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave: keyof ValoresSobreAeuvg, valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setAviso(null);

    try {
      const respuesta = await fetch("/api/admin/sobre-aeuvg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (respuesta.ok) {
        setAviso({ tipo: "exito", texto: "La información se guardó y ya se ve en el sitio." });
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        errores?: Record<string, string>;
        mensaje?: string;
      };

      if (cuerpo.errores && Object.keys(cuerpo.errores).length > 0) {
        setErrores(cuerpo.errores);
        const campos = Object.keys(cuerpo.errores).map((campo) => ETIQUETAS_CAMPO_AEUVG[campo]);
        setAviso({ tipo: "error", texto: `Revisa los campos: ${campos.join(", ")}.` });
        return;
      }

      setAviso({ tipo: "error", texto: cuerpo.mensaje ?? "No se pudo guardar la información." });
    } catch {
      setAviso({
        tipo: "error",
        texto: "No se pudo conectar con el servidor. Revisa tu conexión.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="border-borde bg-superficie flex flex-col gap-5 rounded-[1.25rem] border p-5 sm:p-6"
    >
      <div>
        <h2 className="text-texto text-xl font-bold">Información de la página</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Ningún campo es obligatorio: lo que quede vacío se muestra en la página como pendiente, y
          el bloque de contacto se omite si no tiene datos.
        </p>
      </div>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      <Campo
        etiqueta="Quiénes somos"
        nombre="descripcion"
        error={errores.descripcion}
        ayuda="La presentación que abre la página."
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

      <div className="grid gap-5 md:grid-cols-2">
        <Campo etiqueta="Misión" nombre="mision" error={errores.mision}>
          <textarea
            id="mision"
            value={valores.mision}
            onChange={(evento) => cambiar("mision", evento.target.value)}
            rows={5}
            maxLength={2000}
            className={claseCampo}
          />
        </Campo>

        <Campo etiqueta="Visión" nombre="vision" error={errores.vision}>
          <textarea
            id="vision"
            value={valores.vision}
            onChange={(evento) => cambiar("vision", evento.target.value)}
            rows={5}
            maxLength={2000}
            className={claseCampo}
          />
        </Campo>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Campo etiqueta="Correo" nombre="correo" error={errores.correo}>
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
          etiqueta="Teléfono"
          nombre="telefono"
          error={errores.telefono}
          ayuda="Ocho dígitos, por ejemplo 5555 4444."
        >
          <input
            id="telefono"
            type="tel"
            value={valores.telefono}
            onChange={(evento) => cambiar("telefono", evento.target.value)}
            maxLength={30}
            className={claseCampo}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Información de contacto"
        nombre="informacionContacto"
        error={errores.informacionContacto}
        ayuda="Por ejemplo la oficina o el horario de atención."
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

      <div>
        <Boton type="submit" cargando={guardando}>
          Guardar información
        </Boton>
      </div>
    </form>
  );
}
