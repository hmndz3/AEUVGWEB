import Link from "next/link";

import { FormularioEvento, VALORES_VACIOS } from "@/components/admin/formulario-evento";
import { listarCategorias, listarOrganizadores } from "@/lib/eventos/consultas-eventos";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoEvento() {
  const [categorias, organizadores] = await Promise.all([
    listarCategorias(),
    listarOrganizadores(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/eventos" className="text-primario text-sm font-bold hover:underline">
          ← Volver a eventos
        </Link>
        <h1 className="text-texto mt-3 text-3xl font-extrabold tracking-tight">Crear evento</h1>
        <p className="text-texto-suave mt-2 max-w-2xl text-sm leading-relaxed">
          El evento se guarda como borrador. No aparece en el sitio hasta que lo publiques desde el
          listado.
        </p>
      </div>

      <FormularioEvento
        valoresIniciales={VALORES_VACIOS}
        categorias={categorias}
        organizadores={organizadores}
      />
    </div>
  );
}
