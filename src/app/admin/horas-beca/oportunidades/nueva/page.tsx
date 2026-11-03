import Link from "next/link";

import {
  FormularioOportunidad,
  VALORES_OPORTUNIDAD_VACIOS,
} from "@/components/admin/formulario-oportunidad";

export const dynamic = "force-dynamic";

const RUTA = "/admin/horas-beca/oportunidades";

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={RUTA} className="text-primario text-sm font-bold hover:underline">
          ← Volver a las convocatorias
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">
          Nueva convocatoria
        </h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          Describe el apoyo que se necesita. La convocatoria se guarda como borrador y no se ve en
          el sitio hasta que la publiques.
        </p>
      </div>

      <FormularioOportunidad valoresIniciales={VALORES_OPORTUNIDAD_VACIOS} destino={RUTA} />
    </div>
  );
}
