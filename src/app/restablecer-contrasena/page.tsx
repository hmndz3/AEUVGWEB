import Image from "next/image";
import Link from "next/link";

import { FormularioRestablecer } from "@/components/autenticacion/formulario-restablecer";
import { Icono } from "@/components/autenticacion/icono";
import { MarcoAcceso } from "@/components/autenticacion/marco-acceso";

export const dynamic = "force-dynamic";

function PanelRestablecer() {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-white p-3 shadow-sm">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={30} height={30} />
        </span>
        <span className="text-texto-suave text-[10px] font-extrabold tracking-widest">
          ACCESO SEGURO
        </span>
      </div>
      <div className="bg-turquesa mt-7 h-1 w-10 rounded-full" />
      <h2 className="text-texto mt-4 text-2xl font-extrabold tracking-tight">
        Define tu contraseña nueva
      </h2>
      <p className="text-texto-suave mt-3 text-sm leading-relaxed">
        Al guardarla, el enlace queda consumido y las solicitudes anteriores dejan de ser válidas.
      </p>
      <div className="mt-7 rounded-xl bg-white p-5 shadow-md">
        <p className="text-turquesa flex items-center gap-2 text-[10px] font-extrabold tracking-wider uppercase">
          <Icono nombre="escudo" className="size-4" /> Una contraseña segura
        </p>
        <ul className="text-texto-suave mt-4 space-y-2 text-xs leading-relaxed">
          <li>Al menos 8 caracteres.</li>
          <li>Una letra mayúscula y una minúscula.</li>
          <li>Al menos un número.</li>
          <li>Al menos un símbolo.</li>
        </ul>
      </div>
      <div className="bg-primario-suave text-turquesa mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold">
        <Icono nombre="candado" className="size-4" /> Enlace de un solo uso
      </div>
    </>
  );
}

function EnlaceInvalido() {
  return (
    <div className="bg-error/10 border-error/30 mt-8 max-w-xl rounded-2xl border p-6">
      <p className="text-texto flex items-center gap-2 text-sm font-bold">
        <Icono nombre="informacion" className="size-5" /> El enlace no es válido
      </p>
      <p className="text-texto-suave mt-2 text-sm leading-relaxed">
        El enlace está incompleto o ya se utilizó. Solicita uno nuevo para continuar.
      </p>
      <Link
        href="/recuperar-contrasena"
        className="bg-primario hover:bg-primario-fuerte mt-5 inline-flex h-11 items-center rounded-xl px-6 text-sm font-bold text-white transition-colors"
      >
        Solicitar enlace nuevo
      </Link>
    </div>
  );
}

export default async function PaginaRestablecerContrasena({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token: valor } = await searchParams;
  const token = typeof valor === "string" ? valor : "";

  return (
    <MarcoAcceso variante="seguridad" panel={<PanelRestablecer />}>
      <div className="flex min-h-[590px] flex-col justify-between">
        <div>
          <Link
            href="/iniciar-sesion"
            className="text-texto-suave hover:text-primario inline-flex items-center gap-2 text-sm font-semibold"
          >
            <Icono nombre="flechaAtras" className="size-4" /> Volver a inicio de sesión
          </Link>
          <span className="bg-superficie-suave text-turquesa mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
            <Icono nombre="escudo" className="size-4" /> Restablecimiento
          </span>
          <h1 className="text-texto mt-4 text-3xl font-extrabold tracking-tight">
            Nueva contraseña
          </h1>
          <p className="text-texto-suave mt-2 max-w-xl text-sm leading-relaxed">
            Elige una contraseña que no hayas usado antes en la plataforma.
          </p>

          {token ? <FormularioRestablecer token={token} /> : <EnlaceInvalido />}
        </div>
      </div>
    </MarcoAcceso>
  );
}
