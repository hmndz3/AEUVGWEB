"use client";

import { SelectorFecha } from "@/components/ui/selector-fecha";
import { SelectorHora } from "@/components/ui/selector-hora";
import type { LimitesDia } from "@/lib/ui/calendario-selector";

/**
 * Selector de un instante: un día y una hora, lado a lado.
 *
 * Sustituye al campo `datetime-local` del navegador, que junta las dos cosas
 * en un control minúsculo y en el idioma del sistema. El valor entra y sale
 * en el mismo formato que usaba ese campo, `YYYY-MM-DDTHH:MM`, así que los
 * formularios que lo envían no cambian.
 */
export function SelectorFechaHora({
  id,
  valor,
  onCambiar,
  limites = {},
  paso = 15,
  invalido = false,
}: {
  id: string;
  valor: string;
  onCambiar: (valor: string) => void;
  limites?: LimitesDia;
  paso?: number;
  invalido?: boolean;
}) {
  const [dia = "", hora = ""] = valor.split("T");

  // Elegir solo una de las dos mitades deja el valor incompleto a propósito:
  // el formulario lo rechaza igual que rechazaba un datetime-local vacío, y
  // así no se inventa una hora que nadie eligió.
  const componer = (nuevoDia: string, nuevaHora: string) =>
    onCambiar(nuevoDia && nuevaHora ? `${nuevoDia}T${nuevaHora}` : "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="min-w-0 flex-1">
        <SelectorFecha
          id={id}
          valor={dia}
          onCambiar={(nuevoDia) => componer(nuevoDia, hora)}
          limites={limites}
          invalido={invalido}
        />
      </div>
      <div className="min-w-0 sm:w-44">
        <SelectorHora
          id={`${id}-hora`}
          valor={hora}
          onCambiar={(nuevaHora) => componer(dia, nuevaHora)}
          paso={paso}
          invalido={invalido}
        />
      </div>
    </div>
  );
}
