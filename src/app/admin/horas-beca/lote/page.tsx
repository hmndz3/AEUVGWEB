import Link from "next/link";

import { FormularioLoteHoras } from "@/components/admin/formulario-lote-horas";

export const dynamic = "force-dynamic";

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/horas-beca" className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          Registrar horas a varios estudiantes
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Para cuando una misma actividad la realizaron varias personas. Pega la lista de carnets,
          escribe la actividad una sola vez y se registra un renglón por estudiante.
        </p>
      </div>

      <FormularioLoteHoras destino="/admin/horas-beca" />
    </div>
  );
}
