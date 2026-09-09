import Image from "next/image";
import Link from "next/link";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";

function Selector({
  etiqueta,
  icono,
  children,
}: {
  etiqueta: string;
  icono: "edificio" | "graduacion";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-texto text-sm font-semibold">{etiqueta}</label>
      <div className="relative">
        <Icono
          nombre={icono}
          className="text-texto-suave pointer-events-none absolute top-3.5 left-3.5"
        />
        <select className="border-borde bg-superficie text-texto focus:border-primario focus:ring-primario/20 h-12 w-full appearance-none rounded-xl border py-3 pr-10 pl-11 text-sm shadow-sm outline-none focus:ring-4">
          {children}
        </select>
        <Icono
          nombre="chevron"
          className="text-texto-suave pointer-events-none absolute top-3.5 right-3.5"
        />
      </div>
    </div>
  );
}

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

        <form className="mt-7 grid max-w-2xl gap-5">
          <CampoAcceso
            id="nombre"
            etiqueta="Nombre completo"
            icono="persona"
            placeholder="Ej. Sofía Castillo Pineda"
            autoComplete="name"
          />
          <CampoAcceso
            id="carnet"
            etiqueta="Carnet universitario"
            icono="id"
            placeholder="Ej. 22450"
            inputMode="numeric"
            ayuda="Tu número de carnet permite asociar y acreditar tus horas beca institucionales."
          />
          <CampoAcceso
            id="correo"
            etiqueta="Correo institucional UVG"
            icono="at"
            textoLateral="Obligatorio @uvg.edu.gt"
            type="email"
            defaultValue="sofia.castillo@gmail.com"
            error="Debes ingresar tu correo institucional oficial (@uvg.edu.gt)."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Selector etiqueta="Facultad" icono="edificio">
              <option>Selecciona tu facultad</option>
              <option>Facultad de Ingeniería</option>
              <option>Facultad de Ciencias y Humanidades</option>
              <option>Facultad de Educación</option>
            </Selector>
            <Selector etiqueta="Carrera" icono="graduacion">
              <option>Selecciona tu carrera</option>
              <option>Ingeniería en Ciencias de la Computación y TI</option>
              <option>Ingeniería Industrial</option>
              <option>Psicología</option>
            </Selector>
          </div>
          <CampoAcceso
            id="contrasena"
            etiqueta="Contraseña"
            icono="candado"
            type="password"
            placeholder="Mínimo 8 caracteres"
            botonFinal
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
            etiqueta="Confirmar contraseña"
            icono="candado"
            type="password"
            placeholder="Repite tu contraseña"
            botonFinal
          />
          <label className="bg-superficie-suave text-texto flex items-start gap-3 rounded-xl p-3.5 text-sm leading-relaxed">
            <input
              className="accent-primario mt-0.5 size-4 shrink-0"
              type="checkbox"
              defaultChecked
            />
            Acepto los <span className="text-turquesa font-semibold">Términos y Condiciones</span> y
            la Política de Privacidad de AEUVG.
          </label>
          <button
            type="button"
            className="bg-primario hover:bg-primario-fuerte flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors"
          >
            Crear cuenta estudiantil <Icono nombre="flecha" />
          </button>
          <p className="text-texto-suave text-center text-sm">
            ¿Ya tienes cuenta?
            <Link href="/iniciar-sesion" className="text-primario ml-1 font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </MarcoAcceso>
  );
}
