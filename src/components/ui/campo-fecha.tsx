"use client";

import { useState } from "react";

import { SelectorFecha } from "@/components/ui/selector-fecha";
import type { LimitesDia } from "@/lib/ui/calendario-selector";

/**
 * Selector de fecha para un formulario enviado por GET.
 *
 * Los buscadores y los filtros del sitio son formularios comunes sin estado
 * propio: el servidor los pinta con el valor que trae la dirección. El
 * selector sí necesita estado, así que este envoltorio lo guarda y deja el
 * valor en un campo oculto, que es lo que viaja al enviar.
 */
export function CampoFecha({
  id,
  name,
  valorInicial,
  limites,
  placeholder,
}: {
  id: string;
  name: string;
  valorInicial?: string;
  limites?: LimitesDia;
  placeholder?: string;
}) {
  const [valor, setValor] = useState(valorInicial ?? "");

  return (
    <SelectorFecha
      id={id}
      name={name}
      valor={valor}
      onCambiar={setValor}
      limites={limites}
      placeholder={placeholder}
    />
  );
}
