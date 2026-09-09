import Image from "next/image";

import { Icono } from "@/components/autenticacion/icono";

export function PanelVerificacion() {
  return (
    <>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide">
          <Icono nombre="escudo" className="size-4" /> Protección de cuenta
        </span>
        <div className="text-texto mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <Image src="/logo-aeuvg.png" alt="AEUVG" width={38} height={38} />
          <span className="text-sm font-extrabold">AEUVG</span>
        </div>
        <h2 className="mt-8 max-w-sm text-3xl leading-tight font-extrabold tracking-tight">
          Una comunidad segura comienza verificando tu identidad UVG.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
          Los enlaces son temporales, de un solo uso y están vinculados exclusivamente a tu cuenta.
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 pt-8 text-[11px] font-semibold text-white/60">
        <Icono nombre="candado" className="size-4" /> Nunca compartas tu enlace de verificación
      </div>
    </>
  );
}
