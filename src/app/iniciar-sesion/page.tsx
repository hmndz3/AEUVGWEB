"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";
import { destinoSeguro } from "@/lib/auth/destino-seguro";

function PanelInicioSesion() {
  return (
    <>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide">
          <Icono nombre="personas" className="size-4" />
          Comunidad Universitaria Oficial
        </span>
        <div className="text-texto mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={38} height={38} />
          <span className="text-sm font-extrabold">AEUVG</span>
          <span className="text-turquesa text-xs font-bold">ESTUDIANTES UVG</span>
        </div>
        <h2 className="mt-8 max-w-sm text-3xl leading-tight font-extrabold tracking-tight">
          Tu portal para conectar, aprender y liderar en UVG.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
          Accede al ecosistema unificado de asociaciones, clubes y actividades para acompañar tu
          recorrido universitario.
        </p>
      </div>
      <div className="mt-10 space-y-4">
        <TarjetaPanel icono="verificado" titulo="Tutorías y Horas Beca" etiqueta="ACTIVAS">
          Visualiza convocatorias y consulta el avance verificado de tus requisitos académicos.
        </TarjetaPanel>
        <TarjetaPanel icono="calendario" titulo="Calendario de Eventos" etiqueta="2026">
          Entérate de actividades, congresos y festivales organizados para la comunidad.
        </TarjetaPanel>
      </div>
      <div className="mt-auto flex items-center justify-between pt-8 text-[11px] font-semibold text-white/60">
        <span className="flex items-center gap-1.5">
          <Icono nombre="candado" className="size-4" /> Cuenta institucional
        </span>
        <span>2026</span>
      </div>
    </>
  );
}

function TarjetaPanel({
  icono,
  titulo,
  etiqueta,
  children,
}: {
  icono: React.ComponentProps<typeof Icono>["nombre"];
  titulo: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border-l-cielo rounded-xl border-l-4 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex gap-3">
        <span className="bg-cielo/20 text-cielo flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icono nombre={icono} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{titulo}</h3>
            <span className="bg-lima/20 text-lima rounded-full px-2 py-0.5 text-[9px] font-extrabold">
              {etiqueta}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/65">{children}</p>
        </div>
      </div>
    </article>
  );
}

function FormularioInicioSesion() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      const respuesta = await fetch("/api/auth/iniciar-sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      const resultado = (await respuesta.json()) as { mensaje: string };
      setMensaje(resultado.mensaje);
      setSesionIniciada(respuesta.ok);

      if (respuesta.ok) {
        // El middleware conserva la ruta pedida cuando redirige al acceso.
        router.replace(destinoSeguro(parametros.get("continuar")));
        router.refresh();
      }
    } catch {
      setMensaje("El servicio de autenticación no está disponible temporalmente.");
      setSesionIniciada(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso panel={<PanelInicioSesion />}>
      <div className="flex min-h-[590px] flex-col justify-between">
        <div>
          <span className="bg-primario-suave text-texto-suave inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold">
            <i className="bg-lima size-2 rounded-full" /> Acceso estudiantil <span>•</span> Ciclo
            académico 2026
          </span>
          <h1 className="text-texto mt-5 text-3xl font-extrabold tracking-tight sm:text-[32px]">
            Iniciar sesión
          </h1>
          <p className="text-texto-suave mt-2 max-w-xl text-sm leading-relaxed">
            Ingresa con tus credenciales institucionales de la Universidad del Valle de Guatemala
            para gestionar tus eventos, tutorías y horas beca.
          </p>

          <form className="mt-8 flex max-w-xl flex-col gap-5" onSubmit={iniciarSesion} noValidate>
            <CampoAcceso
              id="correo"
              name="correo"
              etiqueta="Correo institucional UVG"
              icono="at"
              textoLateral="Dominio institucional"
              type="email"
              placeholder="ejemplo@uvg.edu.gt"
              autoComplete="email"
              ayuda="Ingresa tu usuario institucional asignado."
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
            />
            <CampoAcceso
              id="contrasena"
              name="contrasena"
              etiqueta="Contraseña"
              icono="candado"
              textoLateral="Requerido"
              type="password"
              placeholder="••••••••••"
              autoComplete="current-password"
              botonFinal
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
            />
            <div className="flex flex-col items-start justify-between gap-3 pt-1 sm:flex-row sm:items-center">
              <label className="text-texto flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input className="accent-primario size-4 rounded" type="checkbox" defaultChecked />
                Mantener sesión iniciada
              </label>
              <Link
                href="/recuperar-contrasena"
                className="text-turquesa text-sm font-bold hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="bg-primario hover:bg-primario-fuerte disabled:bg-texto-suave mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors disabled:cursor-not-allowed"
            >
              {enviando ? "Verificando…" : "Iniciar sesión"}
              <Icono nombre="flecha" className="text-cielo" />
            </button>
            {mensaje && (
              <p
                className={
                  sesionIniciada
                    ? "text-exito text-sm font-semibold"
                    : "text-error text-sm font-semibold"
                }
                role="status"
              >
                {mensaje}
              </p>
            )}
          </form>
          <p className="text-texto-suave mt-6 text-center text-sm">
            ¿No tienes cuenta?
            <Link href="/crear-cuenta" className="text-turquesa ml-1 font-bold hover:underline">
              Crea una cuenta ✨
            </Link>
          </p>
        </div>
        <div className="bg-superficie-suave text-texto-suave mt-8 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold">
          <Icono nombre="escudo" className="text-turquesa size-4" />
          Tu contraseña se guarda cifrada y nunca viaja en el enlace
        </div>
      </div>
    </MarcoAcceso>
  );
}

// useSearchParams obliga a delimitar la parte dinámica para poder prerenderizar
// el resto de la pantalla.
export default function PaginaInicioSesion() {
  return (
    <Suspense fallback={null}>
      <FormularioInicioSesion />
    </Suspense>
  );
}
