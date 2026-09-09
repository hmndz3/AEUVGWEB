"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";

function Selector({
  etiqueta,
  icono,
  children,
  id,
  value,
  onChange,
  disabled,
  error,
}: {
  etiqueta: string;
  icono: "edificio" | "graduacion";
  children: React.ReactNode;
  id: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-texto text-sm font-semibold">
        {etiqueta}
      </label>
      <div className="relative">
        <Icono
          nombre={icono}
          className="text-texto-suave pointer-events-none absolute top-3.5 left-3.5"
        />
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/20 disabled:bg-superficie-suave h-12 w-full appearance-none rounded-xl border py-3 pr-10 pl-11 text-sm shadow-sm outline-none focus:ring-4 disabled:cursor-not-allowed"
        >
          {children}
        </select>
        <Icono
          nombre="chevron"
          className="text-texto-suave pointer-events-none absolute top-3.5 right-3.5"
        />
      </div>
      {error && <p className="text-error text-xs font-semibold">{error}</p>}
    </div>
  );
}

type Facultad = {
  idFacultad: number;
  nombre: string;
  carreras: { idCarrera: number; nombre: string }[];
};

const datosIniciales = {
  nombreCompleto: "",
  carnet: "",
  correo: "",
  idFacultad: "",
  idCarrera: "",
  contrasena: "",
  confirmarContrasena: "",
  aceptaTerminos: false,
};

function PanelRegistro() {
  return (
    <>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide">
          <Icono nombre="graduacion" className="size-4" /> Comunidad Universitaria Oficial
        </span>
        <div className="text-texto mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={38} height={38} />
          <span className="text-sm font-extrabold">AEUVG</span>
          <span className="text-turquesa text-xs font-bold">Comunidad Activa UVG</span>
        </div>
        <h2 className="mt-8 max-w-sm text-3xl leading-tight font-extrabold tracking-tight">
          Tu voz, tu comunidad y tu participación activa en cada paso.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
          Gestiona horas beca, participa en eventos y encuentra espacios de aprendizaje desde un
          solo portal estudiantil.
        </p>
      </div>
      <div className="mt-10 space-y-4">
        <BloqueRegistro titulo="Horas beca automatizadas" icono="escudo">
          Acreditación directa de actividades institucionales vinculadas a tu carnet.
        </BloqueRegistro>
        <BloqueRegistro titulo="Red estudiantil activa" icono="personas">
          Descubre clubes, asociaciones y eventos de tu comunidad universitaria.
        </BloqueRegistro>
      </div>
      <div className="mt-auto flex items-center justify-between pt-8 text-[11px] font-semibold text-white/60">
        <span className="flex items-center gap-1.5">
          <Icono nombre="candado" className="size-4" /> Cifrado seguro UVG
        </span>
        <span>2026</span>
      </div>
    </>
  );
}

function BloqueRegistro({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof Icono>["nombre"];
  children: React.ReactNode;
}) {
  return (
    <article className="border-l-lima rounded-xl border-l-4 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex gap-3">
        <span className="bg-cielo/20 text-cielo flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icono nombre={icono} />
        </span>
        <div>
          <h3 className="text-sm font-bold">{titulo}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/65">{children}</p>
        </div>
      </div>
    </article>
  );
}

export default function PaginaCrearCuenta() {
  const [datos, setDatos] = useState(datosIniciales);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [dominio, setDominio] = useState("institucional");
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();

    void fetch("/api/catalogos/academicos", { signal: controlador.signal, cache: "no-store" })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error();
        return (await respuesta.json()) as {
          facultades: Facultad[];
          dominioInstitucional: string;
        };
      })
      .then((catalogos) => {
        setFacultades(catalogos.facultades);
        setDominio(catalogos.dominioInstitucional);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMensaje("No fue posible cargar facultades y carreras. Intenta nuevamente.");
      });

    return () => controlador.abort();
  }, []);

  const carreras = useMemo(
    () =>
      facultades.find((facultad) => facultad.idFacultad === Number(datos.idFacultad))?.carreras ??
      [],
    [datos.idFacultad, facultades]
  );

  function actualizarCampo(evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = evento.target;
    setDatos((actuales) => ({
      ...actuales,
      [name]: value,
      ...(name === "idFacultad" ? { idCarrera: "" } : {}),
    }));
    setErrores((actuales) => ({ ...actuales, [name]: [] }));
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setMensaje("");
    setErrores({});

    try {
      const respuesta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = (await respuesta.json()) as {
        mensaje: string;
        errores?: Record<string, string[]>;
      };

      setMensaje(resultado.mensaje);
      setErrores(resultado.errores ?? {});
      if (respuesta.status === 202) setRegistrado(true);
    } catch {
      setMensaje("No fue posible conectar con el servicio de registro.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso panel={<PanelRegistro />}>
      <div>
        <span className="bg-primario-suave text-texto-suave inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold">
          <i className="bg-lima size-2 rounded-full" /> Admisión <span>•</span> Ciclo académico 2026
        </span>
        <h1 className="text-texto mt-4 text-3xl font-extrabold tracking-tight">
          Crear tu cuenta estudiantil
        </h1>
        <p className="text-texto-suave mt-2 max-w-xl text-sm leading-relaxed">
          Únete a la plataforma oficial de AEUVG para gestionar tus horas beca, inscribirte a
          eventos y acceder a tutorías académicas.
        </p>

        {registrado ? (
          <div className="bg-superficie-suave mt-8 max-w-2xl rounded-2xl p-6" role="status">
            <span className="bg-turquesa/15 text-turquesa flex size-12 items-center justify-center rounded-full">
              <Icono nombre="verificado" />
            </span>
            <h2 className="text-texto mt-4 text-xl font-extrabold">
              Revisa tu correo institucional
            </h2>
            <p className="text-texto-suave mt-2 text-sm leading-relaxed">{mensaje}</p>
            <Link
              href="/reenviar-verificacion"
              className="text-turquesa mt-5 inline-block text-sm font-bold hover:underline"
            >
              ¿No recibiste el enlace? Solicita uno nuevo
            </Link>
          </div>
        ) : (
          <form className="mt-7 grid max-w-2xl gap-5" onSubmit={enviarFormulario} noValidate>
            <CampoAcceso
              id="nombre"
              name="nombreCompleto"
              etiqueta="Nombre completo"
              icono="persona"
              placeholder="Ej. Sofía Castillo Pineda"
              autoComplete="name"
              value={datos.nombreCompleto}
              onChange={actualizarCampo}
              error={errores.nombreCompleto?.[0]}
            />
            <CampoAcceso
              id="carnet"
              name="carnet"
              etiqueta="Carnet universitario"
              icono="id"
              placeholder="Ej. 22450"
              inputMode="numeric"
              ayuda="Tu número de carnet permite asociar y acreditar tus horas beca institucionales."
              value={datos.carnet}
              onChange={actualizarCampo}
              error={errores.carnet?.[0]}
            />
            <CampoAcceso
              id="correo"
              name="correo"
              etiqueta="Correo institucional UVG"
              icono="at"
              textoLateral={`Obligatorio @${dominio}`}
              type="email"
              placeholder={`usuario@${dominio}`}
              autoComplete="email"
              value={datos.correo}
              onChange={actualizarCampo}
              error={errores.correo?.[0]}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Selector
                id="idFacultad"
                etiqueta="Facultad"
                icono="edificio"
                value={datos.idFacultad}
                onChange={actualizarCampo}
                error={errores.idFacultad?.[0]}
              >
                <option value="">Selecciona tu facultad</option>
                {facultades.map((facultad) => (
                  <option key={facultad.idFacultad} value={facultad.idFacultad}>
                    {facultad.nombre}
                  </option>
                ))}
              </Selector>
              <Selector
                id="idCarrera"
                etiqueta="Carrera"
                icono="graduacion"
                value={datos.idCarrera}
                onChange={actualizarCampo}
                disabled={!datos.idFacultad}
                error={errores.idCarrera?.[0]}
              >
                <option value="">Selecciona tu carrera</option>
                {carreras.map((carrera) => (
                  <option key={carrera.idCarrera} value={carrera.idCarrera}>
                    {carrera.nombre}
                  </option>
                ))}
              </Selector>
            </div>
            <CampoAcceso
              id="contrasena"
              name="contrasena"
              etiqueta="Contraseña"
              icono="candado"
              type="password"
              placeholder="Mínimo 8 caracteres"
              botonFinal
              autoComplete="new-password"
              value={datos.contrasena}
              onChange={actualizarCampo}
              error={errores.contrasena?.[0]}
            />
            <div className="bg-superficie-suave rounded-xl p-3">
              <div className="flex gap-1.5">
                <span className="bg-turquesa h-1.5 flex-1 rounded-full" />
                <span className="bg-turquesa h-1.5 flex-1 rounded-full" />
                <span className="bg-borde h-1.5 flex-1 rounded-full" />
              </div>
              <p className="text-texto-suave mt-2 flex items-center gap-1.5 text-xs">
                <Icono nombre="escudo" className="text-turquesa size-4" /> Nivel de seguridad:{" "}
                <strong className="text-turquesa">Media</strong> (agrega un símbolo especial).
              </p>
            </div>
            <CampoAcceso
              id="confirmar-contrasena"
              name="confirmarContrasena"
              etiqueta="Confirmar contraseña"
              icono="candado"
              type="password"
              placeholder="Repite tu contraseña"
              botonFinal
              autoComplete="new-password"
              value={datos.confirmarContrasena}
              onChange={actualizarCampo}
              error={errores.confirmarContrasena?.[0]}
            />
            <label className="bg-superficie-suave text-texto flex items-start gap-3 rounded-xl p-3.5 text-sm leading-relaxed">
              <input
                className="accent-primario mt-0.5 size-4 shrink-0"
                type="checkbox"
                name="aceptaTerminos"
                checked={datos.aceptaTerminos}
                onChange={(evento) =>
                  setDatos((actuales) => ({ ...actuales, aceptaTerminos: evento.target.checked }))
                }
              />
              Acepto los <span className="text-turquesa font-semibold">Términos y Condiciones</span>{" "}
              y la Política de Privacidad de AEUVG.
            </label>
            {errores.aceptaTerminos?.[0] && (
              <p className="text-error text-xs font-semibold">{errores.aceptaTerminos[0]}</p>
            )}
            {mensaje && (
              <p className="text-error text-sm font-semibold" role="alert">
                {mensaje}
              </p>
            )}
            <button
              type="submit"
              disabled={enviando || facultades.length === 0}
              className="bg-primario hover:bg-primario-fuerte disabled:bg-texto-suave flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors disabled:cursor-not-allowed"
            >
              {enviando ? "Creando cuenta…" : "Crear cuenta estudiantil"} <Icono nombre="flecha" />
            </button>
            <p className="text-texto-suave text-center text-sm">
              ¿Ya tienes cuenta?
              <Link href="/iniciar-sesion" className="text-primario ml-1 font-bold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </MarcoAcceso>
  );
}
