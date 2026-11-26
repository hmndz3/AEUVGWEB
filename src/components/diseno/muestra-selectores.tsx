"use client";

import { useState } from "react";

import { EtiquetaCampo } from "@/components/ui/etiqueta-campo";
import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorFechaHora } from "@/components/ui/selector-fecha-hora";
import { SelectorHora } from "@/components/ui/selector-hora";
import { hoyEnGuatemala } from "@/lib/ui/calendario-selector";

/**
 * Los selectores de fecha y de hora, en el catálogo del sistema de diseño.
 *
 * Están aquí porque son los únicos controles del sitio con estado propio y
 * con un desplegable: el catálogo existe para poder verlos y probarlos sin
 * tener que entrar a un formulario real con sesión y datos detrás.
 */
export function MuestraSelectores() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cuando, setCuando] = useState("");
  const [soloMartesYJueves, setSoloMartesYJueves] = useState("");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="muestra-fecha">Fecha</EtiquetaCampo>
        <SelectorFecha id="muestra-fecha" valor={fecha} onCambiar={setFecha} />
        <p className="text-texto-suave text-xs">Se guarda como {fecha || "—"}.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="muestra-hora">Hora</EtiquetaCampo>
        <SelectorHora id="muestra-hora" valor={hora} onCambiar={setHora} paso={30} />
        <p className="text-texto-suave text-xs">Se guarda como {hora || "—"}.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="muestra-limitada">
          Solo martes y jueves, de hoy en adelante
        </EtiquetaCampo>
        <SelectorFecha
          id="muestra-limitada"
          valor={soloMartesYJueves}
          onCambiar={setSoloMartesYJueves}
          limites={{ minimo: hoyEnGuatemala(), diasPermitidos: [2, 4] }}
          placeholder="Elige un martes o un jueves"
        />
        <p className="text-texto-suave text-xs">
          Es como se usa al agendar una tutoría: solo los días que el tutor atiende.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <EtiquetaCampo htmlFor="muestra-cuando">Fecha y hora</EtiquetaCampo>
        <SelectorFechaHora id="muestra-cuando" valor={cuando} onCambiar={setCuando} />
        <p className="text-texto-suave text-xs">Se guarda como {cuando || "—"}.</p>
      </div>
    </div>
  );
}
