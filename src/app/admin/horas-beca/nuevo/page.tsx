import Link from "next/link";

import {
  FormularioHoraBeca,
  VALORES_HORA_BECA_VACIOS,
} from "@/components/admin/formulario-hora-beca";
import { destinoPanelHoras } from "@/lib/horas-beca/formato-horas";

export const dynamic = "force-dynamic";

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // El listado del que se viene, con sus filtros, para volver a él al guardar.
  const destino = destinoPanelHoras((await searchParams).volver);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={destino} className="text-primario text-sm font-bold hover:underline">
          ← Volver al listado
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">Registrar horas</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          El estudiante se identifica por su carnet. Si todavía no tiene cuenta en la plataforma, el
          registro queda sin vincular y se asocia solo cuando la cree.
        </p>
      </div>

      <FormularioHoraBeca valoresIniciales={VALORES_HORA_BECA_VACIOS} destino={destino} />
    </div>
  );
}
