import Image from "next/image";
import Link from "next/link";

import { CampoAcceso } from "@/components/autenticacion/campo-acceso";
import { Icono } from "@/components/autenticacion/icono";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";

function PanelRecuperacion() {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-white p-3 shadow-sm">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={30} height={30} />
        </span>
        <span className="text-texto-suave text-[10px] font-extrabold tracking-widest">
          PROTOCOLO TLS 1.3
        </span>
      </div>
      <div className="bg-turquesa mt-7 h-1 w-10 rounded-full" />
      <h2 className="text-texto mt-4 text-2xl font-extrabold tracking-tight">
        Protegemos tu identidad universitaria
      </h2>
      <p className="text-texto-suave mt-3 text-sm leading-relaxed">
        El enlace de recuperación expira en 15 minutos por motivos de seguridad académica y
        resguardo de tus datos de horas beca.
      </p>
      <div className="mt-7 rounded-xl bg-white p-5 shadow-md">
        <p className="text-turquesa flex items-center gap-2 text-[10px] font-extrabold tracking-wider uppercase">
          <Icono nombre="verificado" className="size-4" /> Proceso de restablecimiento
        </p>
        <ol className="mt-5 space-y-4">
          <Paso numero="1" titulo="Solicita el enlace">
            Ingresa tu correo institucional validado por el directorio UVG.
          </Paso>
          <Paso numero="2" titulo="Revisa tu bandeja de entrada">
            Abre el correo con asunto “Recuperación de credencial AEUVG”.
          </Paso>
          <Paso numero="3" titulo="Define tu nueva clave">
            Crea una credencial robusta para volver a consultar tutorías y becas.
          </Paso>
        </ol>
      </div>
      <div className="bg-primario-suave text-turquesa mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold">
        <Icono nombre="candado" className="size-4" /> Cifrado de punta a punta{" "}
        <span className="ml-auto text-[9px]">ACTIVO</span>
      </div>
    </>
  );
}

function Paso({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="bg-primario flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
        {numero}
      </span>
      <span>
        <strong className="text-texto block text-sm">{titulo}</strong>
        <span className="text-texto-suave mt-0.5 block text-xs leading-relaxed">{children}</span>
      </span>
    </li>
  );
}

export default function PaginaRecuperarContrasena() {
  return (
    <MarcoAcceso variante="seguridad" panel={<PanelRecuperacion />}>
      <div className="flex min-h-[590px] flex-col justify-between">
        <div>
          <Link
            href="/iniciar-sesion"
            className="text-texto-suave hover:text-primario inline-flex items-center gap-2 text-sm font-semibold"
          >
            <Icono nombre="flechaAtras" className="size-4" /> Volver a inicio de sesión
          </Link>
          <span className="bg-superficie-suave text-turquesa mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
            <Icono nombre="verificado" className="size-4" /> Seguridad de la cuenta
          </span>
          <h1 className="text-texto mt-4 text-3xl font-extrabold tracking-tight">
            Recuperar contraseña
          </h1>
          <p className="text-texto-suave mt-2 max-w-xl text-sm leading-relaxed">
            Ingresa el correo institucional UVG asociado a tu cuenta de estudiante. Te enviaremos un
            enlace seguro para restablecer tu acceso en pocos minutos.
          </p>
          <form className="mt-8 max-w-xl">
            <CampoAcceso
              id="correo-recuperacion"
              etiqueta="Correo institucional UVG"
              icono="at"
              textoLateral="Terminación @uvg.edu.gt"
              type="email"
              placeholder="estudiante@uvg.edu.gt"
              ayuda="Debe ser la dirección oficial proporcionada por la universidad."
            />
            <button
              type="button"
              className="bg-primario hover:bg-primario-fuerte mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors"
            >
              Enviar enlace de recuperación <Icono nombre="flecha" />
            </button>
          </form>
        </div>
        <div className="bg-superficie-suave text-texto-suave mt-10 flex gap-3 rounded-xl p-4 text-xs leading-relaxed">
          <Icono nombre="informacion" className="mt-0.5 size-5 shrink-0" />
          <p>
            ¿No recuerdas tu correo o perdiste acceso? Contacta a la coordinación de soporte AEUVG
            en <span className="text-turquesa font-bold">soporte@aeuvg.uvg.edu.gt</span> o acércate
            a la oficina en Edificio I.
          </p>
        </div>
      </div>
    </MarcoAcceso>
  );
}
