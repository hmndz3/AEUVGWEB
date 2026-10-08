"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alerta } from "@/components/ui/alerta";
import { Boton } from "@/components/ui/boton";
import { EtiquetaCampo, NotaCamposObligatorios } from "@/components/ui/etiqueta-campo";
import type { CarreraDisponible } from "@/lib/perfil/consultas-perfil";
import { ETIQUETAS_CAMPO_PERFIL } from "@/validators/perfil";

const claseCampo =
  "border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/30 w-full rounded-2xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none";

/**
 * Edición de los datos que el estudiante sí puede cambiar.
 *
 * El aviso de guardado se muestra en la misma pantalla en lugar de navegar a
 * otra: el perfil es la pantalla donde ya está, y sacarlo de ahí para decirle
 * que se guardó no aporta nada.
 */
export function FormularioPerfil({
  telefono: telefonoInicial,
  idCarrera: idCarreraInicial,
  carreras,
}: {
  telefono: string | null;
  idCarrera: number;
  carreras: CarreraDisponible[];
}) {
  const router = useRouter();
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [idCarrera, setIdCarrera] = useState(String(idCarreraInicial));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setErrores({});
    setGeneral(null);
    setGuardado(false);

    try {
      const respuesta = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, idCarrera }),
      });

      if (respuesta.ok) {
        setGuardado(true);
        // Los datos de solo lectura de arriba los genera el servidor, así que se
        // refresca la ruta para que la carrera nueva se vea también ahí.
        router.refresh();
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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto text-lg font-bold">Editar mis datos</h2>
        <p className="text-texto-suave mt-1 text-sm leading-relaxed">
          Puedes actualizar tu teléfono y tu carrera. El resto de los datos los administra AEUVG.
        </p>
      </div>

      {general && <Alerta tipo="error">{general}</Alerta>}
      {guardado && <Alerta tipo="exito">Tus datos se guardaron.</Alerta>}

      <form
        onSubmit={enviar}
        noValidate
        className="border-borde bg-superficie flex flex-col gap-5 rounded-[1.25rem] border p-6"
      >
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

        <div className="flex flex-col gap-1.5">
          <EtiquetaCampo htmlFor="idCarrera" obligatorio>
            Carrera
          </EtiquetaCampo>
          <select
            id="idCarrera"
            required
            value={idCarrera}
            onChange={(evento) => setIdCarrera(evento.target.value)}
            className={claseCampo}
          >
            {carreras.map((carrera) => (
              <option key={carrera.idCarrera} value={carrera.idCarrera}>
                {carrera.nombre} · {carrera.facultad}
              </option>
            ))}
          </select>
          {errores.idCarrera ? (
            <p role="alert" className="text-error text-xs font-medium">
              {errores.idCarrera}
            </p>
          ) : (
            <p className="text-texto-suave text-xs">
              La facultad se toma de la carrera que elijas.
            </p>
          )}
        </div>

        <div>
          <Boton type="submit" cargando={guardando}>
            Guardar cambios
          </Boton>
        </div>
      </form>
    </section>
  );
}
